from django.db import models
from django.contrib.auth.models import User
from menu.models import MenuItems
from decimal import Decimal


class Cart(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username}'s Cart"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    menu_item = models.ForeignKey(
        MenuItems,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

        constraints = [
        models.UniqueConstraint(
            fields=["cart", "menu_item"],
            name="unique_cart_menu_item",
        ),
        models.CheckConstraint(
            condition=models.Q(quantity__gte=1),
            name="cart_item_quantity_gte_one",
        ),
    ]

    @property
    def subtotal(self) -> Decimal:
        return self.menu_item.price * self.quantity

    def __str__(self):
        return f"{self.menu_item} ({self.quantity})"