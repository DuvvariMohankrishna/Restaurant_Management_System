from rest_framework import serializers

from .models import Cart, CartItem


# Used for POST /cart/add/
class AddToCartSerializer(serializers.ModelSerializer):

    quantity = serializers.IntegerField(
        min_value=1
    )

    class Meta:
        model = CartItem
        fields = (
            "menu_item",
            "quantity",
        )

    def validate_menu_item(self, menu_item):

        if not menu_item.is_available:
            raise serializers.ValidationError(
                "This menu item is currently unavailable."
            )

        return menu_item


# Used for GET /cart/
class CartItemSerializer(serializers.ModelSerializer):

    menu_item = serializers.StringRelatedField()

    price = serializers.DecimalField(
        source="menu_item.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "menu_item",
            "price",
            "quantity",
            "subtotal",
        )


# Used for GET /cart/
class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Cart
        fields = (
            "id",
            "items",
        )


# Used for PATCH /cart/items/<id>/
class UpdateCartItemSerializer(serializers.ModelSerializer):

    quantity = serializers.IntegerField(
        min_value=1
    )

    class Meta:
        model = CartItem
        fields = (
            "quantity",
        )