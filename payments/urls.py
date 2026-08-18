from django.urls import path

from .views import (
    CreatePaymentAPIView,
    PaymentStatusUpdateAPIView,
    PaymentHistoryAPIView,
    PaymentDetailAPIView,
)


urlpatterns = [
    path(
        "create/",
        CreatePaymentAPIView.as_view(),
        name="create-payment",
    ),

    path(
        "",
        PaymentHistoryAPIView.as_view(),
        name="payment-history",
    ),

    path(
        "<int:pk>/status/",
        PaymentStatusUpdateAPIView.as_view(),
        name="payment-status-update",
    ),

    path(
        "<int:pk>/",
        PaymentDetailAPIView.as_view(),
        name="payment-detail",
    ),
]