from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "table_number",
        "reservation_date",
        "reservation_time",
        "number_of_guests",
        "status",
    )

    search_fields = (
        "user__username",
    )

    list_filter = (
        "status",
        "reservation_date",
    )

    ordering = (
        "-reservation_date",
        "-reservation_time",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )