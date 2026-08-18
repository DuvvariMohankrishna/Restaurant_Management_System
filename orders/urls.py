from django.urls import path

from .views import (
    CreateOrderAPIView,
    OrderHistoryAPIView,
    OrderDetailAPIView,
    OrderStatusUpdateAPIView,
    CancelOrderAPIView,
    AdminOrderHistoryAPIView,
)


urlpatterns = [
    path(
        "create/",
        CreateOrderAPIView.as_view(),
        name="create-order",
    ),

    path(
        "",
        OrderHistoryAPIView.as_view(),
        name="order-history",
    ),

    path(
        "<int:pk>/",
        OrderDetailAPIView.as_view(),
        name="order-detail",
    ),

    path(
        "<int:pk>/status/",
        OrderStatusUpdateAPIView.as_view(),
        name="order-status-update",
    ),

    path(
        "<int:pk>/cancel/",
        CancelOrderAPIView.as_view(),
        name="cancel-order",
    ),
    path(
    "manage/",
    AdminOrderHistoryAPIView.as_view(),
    name="admin-order-history",),
]