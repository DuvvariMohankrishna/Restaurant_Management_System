from django.db import models
from django.contrib.auth.models import User
from menu.models import MenuItems
import uuid


class OrderStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    CONFIRMED = "CONFIRMED", "Confirmed"
    PREPARING = "PREPARING", "Preparing"
    READY = "READY", "Ready"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out For Delivery"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"


class Order(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    order_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    update_at = models.DateTimeField(
        auto_now=True
    )
    class Meta:
        constraints = [
        models.CheckConstraint(
            condition=models.Q(total_amount__gte=0),
            name="order_total_amount_gte_zero",
        ),
    ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = (
                f"ORD-{uuid.uuid4().hex[:8].upper()}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    menu_item = models.ForeignKey(
        MenuItems,
        on_delete=models.PROTECT
    )

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    class Meta:
        constraints = [
        models.CheckConstraint(
            condition=models.Q(quantity__gte=1),
            name="order_item_quantity_gte_one",
        ),
        models.CheckConstraint(
            condition=models.Q(price__gte=0),
            name="order_item_price_gte_zero",
        ),
    ]

    def __str__(self):
        return f"{self.quantity} * {self.menu_item.name}"