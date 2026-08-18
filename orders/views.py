from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404

from django_filters.rest_framework import DjangoFilterBackend

from drf_spectacular.utils import extend_schema

from rest_framework import generics, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin
from cart.models import Cart

from .models import (
    Order,
    OrderItem,
    OrderStatus,
)

from .serializers import (
    CancelOrderResponseSerializer,
    CreateOrderResponseSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)


class CreateOrderAPIView(APIView):

    permission_classes = [IsAuthenticated]

    serializer_class = CreateOrderResponseSerializer

    @extend_schema(
        tags=["Orders"],
        summary="Create order",
        description=(
            "Create an order from the authenticated "
            "user's cart."
        ),
        responses={
            201: CreateOrderResponseSerializer,
        },
    )
    @transaction.atomic
    def post(self, request):

        cart = get_object_or_404(
            Cart.objects
            .select_for_update()
            .prefetch_related("items__menu_item"),
            user=request.user,
        )

        cart_items = cart.items.all()

        if not cart_items.exists():

            return Response(
                {
                    "message": "Your cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        unavailable_items = [
            cart_item.menu_item.name
            for cart_item in cart_items
            if not cart_item.menu_item.is_available
        ]

        if unavailable_items:

            return Response(
                {
                    "message": (
                        "Some items in your cart "
                        "are no longer available."
                    ),
                    "unavailable_items": unavailable_items,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.create(
            user=request.user,
            total_amount=Decimal("0.00"),
        )

        total_amount = Decimal("0.00")

        for cart_item in cart_items:

            menu_item = cart_item.menu_item
            quantity = cart_item.quantity

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                price=menu_item.price,
            )

            total_amount += (
                menu_item.price * quantity
            )

        order.total_amount = total_amount

        order.save(
            update_fields=[
                "total_amount",
                "update_at",
            ]
        )

        cart_items.delete()

        serializer = OrderSerializer(order)

        return Response(
            {
                "message": "Order placed successfully.",
                "order": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderHistoryAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Orders"],
        summary="Order history",
        description=(
            "Retrieve paginated order history for "
            "the authenticated user."
        ),
        responses=OrderSerializer(many=True),
    )
    def get(self, request):

        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related("items__menu_item")
            .order_by("-created_at")
        )

        paginator = PageNumberPagination()

        paginator.page_size = 10

        paginated_orders = paginator.paginate_queryset(
            orders,
            request,
        )

        serializer = OrderSerializer(
            paginated_orders,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )


class OrderDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Orders"],
        summary="Order details",
        description=(
            "Retrieve details of a specific order "
            "belonging to the authenticated user."
        ),
        responses=OrderSerializer,
    )
    def get(self, request, pk):

        order = get_object_or_404(
            Order.objects.prefetch_related(
                "items__menu_item"
            ),
            id=pk,
            user=request.user,
        )

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class OrderStatusUpdateAPIView(APIView):

    permission_classes = [IsStaffOrAdmin]

    @extend_schema(
        tags=["Orders"],
        summary="Update order status",
        description=(
            "Allow staff or administrators to update "
            "an order's status."
        ),
        request=OrderStatusUpdateSerializer,
        responses={
            200: OrderStatusUpdateSerializer,
        },
    )
    def patch(self, request, pk):

        order = get_object_or_404(
            Order,
            id=pk,
        )

        serializer = OrderStatusUpdateSerializer(
            order,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "Order status updated successfully."
                ),
                "order": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class CancelOrderAPIView(APIView):

    permission_classes = [IsAuthenticated]

    serializer_class = CancelOrderResponseSerializer

    @extend_schema(
        tags=["Orders"],
        summary="Cancel order",
        description=(
            "Cancel an eligible order belonging to "
            "the authenticated user."
        ),
        responses={
            200: CancelOrderResponseSerializer,
        },
    )
    def patch(self, request, pk):
        order = get_object_or_404(
            Order,
            id=pk,
            user=request.user,
        )

        if order.status in [
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
        ]:

            return Response(
                {
                    "message": (
                        "Order cannot be cancelled "
                        "because its current status is "
                        f"{order.status}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = OrderStatus.CANCELLED

        order.save(
            update_fields=[
                "status",
                "update_at",
            ]
        )

        serializer = OrderSerializer(order)

        return Response(
            {
                "message": (
                    "Order cancelled successfully."
                ),
                "order": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Orders"],
    summary="Manage all orders",
    description=(
        "Allow staff or administrators to view, search, "
        "filter, order, and paginate all orders."
    ),
)
class AdminOrderHistoryAPIView(
    generics.ListAPIView
):

    permission_classes = [IsStaffOrAdmin]

    serializer_class = OrderSerializer

    queryset = (
        Order.objects
        .select_related("user")
        .prefetch_related("items__menu_item")
        .all()
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
    ]

    search_fields = [
        "order_number",
        "user__username",
        "user__email",
    ]

    ordering_fields = [
        "created_at",
        "total_amount",
        "status",
    ]

    ordering = [
        "-created_at",
    ]