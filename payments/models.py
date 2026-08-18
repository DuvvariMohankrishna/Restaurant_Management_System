from django.db import models

from orders.models import Order

class PaymentMethod(models.TextChoices):
    CASH = "CASH", "Cash"
class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"


class Payment(models.Model):

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    payment_method = models.CharField(
    max_length=20,
    choices=PaymentMethod.choices,
    default=PaymentMethod.CASH,
)

    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )
    class Meta:
        constraints = [
        models.CheckConstraint(
            condition=models.Q(amount__gte=0),
            name="payment_amount_gte_zero",
        ),
    ]

    def __str__(self):

        return (
            f"{self.order.order_number} - "
            f"{self.status}"
        )
