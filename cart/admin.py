from django.contrib import admin
from .models import Cart, CartItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "user__username",
    )

    ordering = (
        "user",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cart",
        "menu_item",
        "quantity",
        "created_at",
    )

    search_fields = (
        "cart__user__username",
        "menu_item__name",
    )

    list_filter = (
        "menu_item",
    )

    ordering = (
        "cart",
    )

    readonly_fields = (
        "created_at",
    )