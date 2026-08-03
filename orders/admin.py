from django.contrib import admin
from .models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order_number",
        "user",
        "total_amount",
        "status",
        "created_at",
    )

    search_fields = (
        "order_number",
        "user__username",
    )

    list_filter = (
        "status",
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "order_number",
        "created_at",
        "update_at",
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "menu_item",
        "quantity",
        "price",
    )

    search_fields = (
        "order__order_number",
        "menu_item__name",
    )

    list_filter = (
        "menu_item",
    )

    ordering = (
        "order",
    )