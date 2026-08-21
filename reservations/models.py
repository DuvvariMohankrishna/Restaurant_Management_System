from django.db import models
from django.contrib.auth.models import User


class ReservationStatus(models.TextChoices):

    PENDING = "PENDING", "Pending"

    CONFIRMED = "CONFIRMED", "Confirmed"

    COMPLETED = "COMPLETED", "Completed"

    CANCELLED = "CANCELLED", "Cancelled"


class Reservation(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reservations",
    )

    reservation_date = models.DateField()

    reservation_time = models.TimeField()

    table_number = models.PositiveIntegerField()

    number_of_guests = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20,
        choices=ReservationStatus.choices,
        default=ReservationStatus.PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"table {self.table_number} - "
            f"{self.reservation_date}"
        )