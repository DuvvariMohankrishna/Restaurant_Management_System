from django.db import models


class Category(models.Model):
    """Represents a food category."""

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "id",
        ]

    def __str__(self):

        return self.name


class MenuItems(models.Model):
    """Represents a food item available in the restaurant."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="menu_items",
    )

    name = models.CharField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
    )

    image = models.ImageField(
        upload_to="menu/",
        blank=True,
        null=True,
    )

    is_available = models.BooleanField(
        default=True,
    )

    preparation_time = models.PositiveIntegerField(
        help_text="Preparation time in minutes",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "id",
        ]

        constraints = [

            models.CheckConstraint(
                condition=models.Q(
                    price__gte=0,
                ),
                name="menu_item_price_gte_zero",
            ),

            models.CheckConstraint(
                condition=models.Q(
                    preparation_time__gte=1,
                ),
                name="menu_item_preparation_time_gte_one",
            ),

        ]

    def __str__(self):

        return self.name