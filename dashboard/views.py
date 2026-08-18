from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum

from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin
from menu.models import MenuItems
from orders.models import Order, OrderStatus
from payments.models import Payment, PaymentStatus
from reservations.models import (
    Reservation,
    ReservationStatus,
)

from .serializers import DashboardResponseSerializer


@extend_schema(
    tags=["Dashboard"],
    summary="Get dashboard statistics",
    description=(
        "Retrieve aggregated statistics for customers, "
        "menu items, orders, payments, revenue, and reservations."
    ),
    responses=DashboardResponseSerializer,
)
class DashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsStaffOrAdmin,
    ]

    def get(self, request):

        # Customer statistics
        customer_stats = User.objects.aggregate(
            total=Count(
                "id",
                filter=Q(
                    is_staff=False,
                    is_superuser=False,
                ),
            ),
        )

        # Menu statistics
        menu_stats = MenuItems.objects.aggregate(
            total=Count("id"),
            available=Count(
                "id",
                filter=Q(is_available=True),
            ),
        )

        # Order statistics
        order_stats = Order.objects.aggregate(
            total=Count("id"),

            pending=Count(
                "id",
                filter=Q(
                    status=OrderStatus.PENDING
                ),
            ),

            confirmed=Count(
                "id",
                filter=Q(
                    status=OrderStatus.CONFIRMED
                ),
            ),

            delivered=Count(
                "id",
                filter=Q(
                    status=OrderStatus.DELIVERED
                ),
            ),

            cancelled=Count(
                "id",
                filter=Q(
                    status=OrderStatus.CANCELLED
                ),
            ),
        )

        # Revenue and payment statistics
        payment_stats = Payment.objects.aggregate(
            successful=Count(
                "id",
                filter=Q(
                    status=PaymentStatus.SUCCESS
                ),
            ),

            pending=Count(
                "id",
                filter=Q(
                    status=PaymentStatus.PENDING
                ),
            ),

            failed=Count(
                "id",
                filter=Q(
                    status=PaymentStatus.FAILED
                ),
            ),

            total_revenue=Sum(
                "amount",
                filter=Q(
                    status=PaymentStatus.SUCCESS
                ),
            ),
        )

        # Reservation statistics
        reservation_stats = Reservation.objects.aggregate(
            total=Count("id"),

            pending=Count(
                "id",
                filter=Q(
                    status=ReservationStatus.PENDING
                ),
            ),

            confirmed=Count(
                "id",
                filter=Q(
                    status=ReservationStatus.CONFIRMED
                ),
            ),
        )

        total_revenue = (
            payment_stats["total_revenue"]
            or 0
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Dashboard data retrieved successfully."
                ),
                "data": {
                    "customers": {
                        "total": customer_stats["total"],
                    },

                    "menu": {
                        "total_items": menu_stats["total"],
                        "available_items": menu_stats[
                            "available"
                        ],
                    },

                    "orders": {
                        "total": order_stats["total"],
                        "pending": order_stats["pending"],
                        "confirmed": order_stats["confirmed"],
                        "delivered": order_stats["delivered"],
                        "cancelled": order_stats["cancelled"],
                    },

                    "revenue": {
                        "total": total_revenue,
                    },

                    "reservations": {
                        "total": reservation_stats["total"],
                        "pending": reservation_stats["pending"],
                        "confirmed": reservation_stats[
                            "confirmed"
                        ],
                    },

                    "payments": {
                        "successful": payment_stats[
                            "successful"
                        ],
                        "pending": payment_stats[
                            "pending"
                        ],
                        "failed": payment_stats[
                            "failed"
                        ],
                    },
                },
            },
            status=status.HTTP_200_OK,
        )