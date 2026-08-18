from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin
from orders.models import Order, OrderStatus

from .models import Payment, PaymentStatus
from .serializers import PaymentSerializer


@extend_schema(
    tags=["Payments"],
    summary="Create cash payment",
    description=(
        "Create a pending cash payment for an order "
        "belonging to the authenticated customer. "
        "The payment amount is taken from the order total "
        "and cannot be supplied by the client."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "integer",
                    "description": "ID of the order to pay for.",
                }
            },
            "required": ["order_id"],
        }
    },
    responses=PaymentSerializer,
)
class CreatePaymentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        order_id = request.data.get("order_id")

        if not order_id:
            return Response(
                {
                    "message": "order_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(
            Order.objects.select_for_update(),
            id=order_id,
            user=request.user,
        )

        if order.status == OrderStatus.CANCELLED:

            return Response(
                {
                    "message": (
                        "Payment cannot be created "
                        "for a cancelled order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == OrderStatus.DELIVERED:

            return Response(
                {
                    "message": (
                        "Payment cannot be created "
                        "for a delivered order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Payment.objects.filter(
            order=order
        ).exists():

            return Response(
                {
                    "message": (
                        "Payment already exists "
                        "for this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount,
            status=PaymentStatus.PENDING,
        )

        serializer = PaymentSerializer(payment)

        return Response(
            {
                "message": (
                    "Cash payment created successfully."
                ),
                "payment": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Payments"],
    summary="Update payment status",
    description=(
        "Update a pending cash payment to SUCCESS or FAILED. "
        "Restricted to Staff/Admin users. "
        "When a payment succeeds, a pending order is "
        "automatically confirmed."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": [
                        "SUCCESS",
                        "FAILED",
                    ],
                    "description": "New payment status.",
                }
            },
            "required": ["status"],
        }
    },
    responses=PaymentSerializer,
)
class PaymentStatusUpdateAPIView(APIView):

    permission_classes = [IsStaffOrAdmin]

    @transaction.atomic
    def patch(self, request, pk):

        payment = get_object_or_404(
            Payment.objects.select_related("order"),
            id=pk,
        )

        new_status = request.data.get("status")

        allowed_statuses = [
            PaymentStatus.SUCCESS,
            PaymentStatus.FAILED,
        ]

        if new_status not in allowed_statuses:

            return Response(
                {
                    "message": (
                        "Invalid payment status. "
                        "Allowed values are SUCCESS "
                        "or FAILED."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.status != PaymentStatus.PENDING:

            return Response(
                {
                    "message": (
                        "Only pending payments can "
                        "have their status updated."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = new_status

        payment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        if new_status == PaymentStatus.SUCCESS:

            order = payment.order

            if order.status == OrderStatus.PENDING:

                order.status = OrderStatus.CONFIRMED

                order.save(
                    update_fields=[
                        "status",
                        "update_at",
                    ]
                )

        serializer = PaymentSerializer(payment)

        return Response(
            {
                "message": (
                    "Payment status updated successfully."
                ),
                "payment": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Payments"],
    summary="View payment history",
    description=(
        "Retrieve payment history for the "
        "authenticated customer's orders."
    ),
    responses=PaymentSerializer(many=True),
)
class PaymentHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        payments = (
            Payment.objects
            .filter(order__user=request.user)
            .select_related("order")
            .order_by("-created_at")
        )

        paginator = PageNumberPagination()

        paginator.page_size = 10

        paginated_payments = paginator.paginate_queryset(
            payments,
            request,
        )

        serializer = PaymentSerializer(
            paginated_payments,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

@extend_schema(
    tags=["Payments"],
    summary="View payment details",
    description=(
        "Retrieve a specific payment belonging "
        "to the authenticated customer's order."
    ),
    responses=PaymentSerializer,
)
class PaymentDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        payment = get_object_or_404(
            Payment.objects.select_related("order"),
            id=pk,
            order__user=request.user,
        )

        serializer = PaymentSerializer(payment)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )