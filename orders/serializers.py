from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):

    menu_item_name = serializers.CharField(
        source="menu_item.name",
        read_only=True,
    )

    class Meta:
        model = OrderItem

        fields = [
            "id",
            "menu_item",
            "menu_item_name",
            "quantity",
            "price",
        ]

        read_only_fields = [
            "id",
            "price",
        ]


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = Order

        fields = [
            "id",
            "order_number",
            "username",
            "status",
            "total_amount",
            "created_at",
            "update_at",
            "items",
        ]

        read_only_fields = [
            "id",
            "order_number",
            "username",
            "total_amount",
            "created_at",
            "update_at",
            "items",
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order

        fields = [
            "status",
        ]


# Response serializer for creating an order
class CreateOrderResponseSerializer(serializers.Serializer):

    message = serializers.CharField()

    order = OrderSerializer()


# Response serializer for cancelling an order
class CancelOrderResponseSerializer(serializers.Serializer):

    message = serializers.CharField()

    order = OrderSerializer()