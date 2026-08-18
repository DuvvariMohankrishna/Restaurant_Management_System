from django.urls import path

from .views import (
    ReservationListCreateAPIView,
    ReservationDetailAPIView,
    CancelReservationAPIView,
    AdminReservationStatusAPIView,
    ReservationAvailabilityAPIView,
    ReservationManagementAPIView,
)


urlpatterns = [

    path(
        "",
        ReservationListCreateAPIView.as_view(),
        name="reservation-list-create",
    ),

    path(
        "availability/",
        ReservationAvailabilityAPIView.as_view(),
        name="reservation-availability",
    ),

    path(
        "<int:pk>/",
        ReservationDetailAPIView.as_view(),
        name="reservation-detail",
    ),

    path(
        "<int:pk>/cancel/",
        CancelReservationAPIView.as_view(),
        name="reservation-cancel",
    ),

    path(
        "manage/",
        ReservationManagementAPIView.as_view(),
        name="reservation-management",
    ),

    path(
        "manage/<int:pk>/status/",
        AdminReservationStatusAPIView.as_view(),
        name="admin-reservation-status",
    ),
]