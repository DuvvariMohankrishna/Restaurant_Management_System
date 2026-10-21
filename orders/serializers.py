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

    payment_method = serializers.SerializerMethodField()

    def get_payment_method(self, obj):
        payment = getattr(obj, "payment", None)
        if payment is not None:
            return payment.get_payment_method_display()
        return "Cash"  # Cash is the only supported method in this project.

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
            "payment_method",
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