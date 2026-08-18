from django.shortcuts import get_object_or_404

from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
)

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)


@extend_schema(
    tags=["Cart"],
    summary="Add item to cart",
    description=(
        "Add a menu item to the authenticated user's cart. "
        "If the item already exists, its quantity is increased."
    ),
    request=AddToCartSerializer,
    responses={
        201: OpenApiResponse(
            description="Item added successfully."
        ),
    },
)
class AddToCartAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = AddToCartSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        menu_item = serializer.validated_data[
            "menu_item"
        ]

        quantity = serializer.validated_data[
            "quantity"
        ]

        cart_item, item_created = (
            CartItem.objects.get_or_create(
                cart=cart,
                menu_item=menu_item,
                defaults={
                    "quantity": quantity,
                },
            )
        )

        if not item_created:

            cart_item.quantity += quantity

            cart_item.save(
                update_fields=["quantity"]
            )

        return Response(
            {
                "message": "Item added successfully.",
                "cart_id": cart.id,
                "cart_item_id": cart_item.id,
                "menu_item": str(menu_item),
                "quantity": cart_item.quantity,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Cart"],
    summary="View cart",
    description=(
        "Retrieve the authenticated user's cart "
        "with menu items, prices, quantities, and subtotals."
    ),
    responses=CartSerializer,
)
class CartAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        cart = get_object_or_404(
            Cart.objects.prefetch_related(
                "items__menu_item"
            ),
            user=request.user,
        )

        serializer = CartSerializer(cart)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Cart"],
    summary="Update cart item",
    description=(
        "Update the quantity of an item "
        "belonging to the authenticated user's cart."
    ),
    request=UpdateCartItemSerializer,
    responses={
        200: UpdateCartItemSerializer,
    },
)
class UpdateCartItemAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        cart_item = get_object_or_404(
            CartItem,
            id=pk,
            cart__user=request.user,
        )

        serializer = UpdateCartItemSerializer(
            cart_item,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": "Cart item updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Cart"],
    summary="Remove cart item",
    description=(
        "Remove a specific item from "
        "the authenticated user's cart."
    ),
    responses={
        200: OpenApiResponse(
            description="Cart item removed successfully."
        ),
    },
)
class RemoveCartItemAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        cart_item = get_object_or_404(
            CartItem,
            id=pk,
            cart__user=request.user,
        )

        cart_item.delete()

        return Response(
            {
                "message": "Cart item removed successfully."
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Cart"],
    summary="Clear cart",
    description=(
        "Remove all items from the authenticated "
        "user's cart."
    ),
    responses={
        200: OpenApiResponse(
            description="Cart cleared successfully."
        ),
        404: OpenApiResponse(
            description="Cart not found."
        ),
    },
)
class ClearCartAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request):

        try:
            cart = Cart.objects.get(
                user=request.user
            )

        except Cart.DoesNotExist:

            return Response(
                {
                    "message": "Cart not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        deleted_count, _ = (
            cart.items.all().delete()
        )

        return Response(
            {
                "message": "Cart cleared successfully.",
                "items_deleted": deleted_count,
            },
            status=status.HTTP_200_OK,
        )