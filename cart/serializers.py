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

    image_url = serializers.SerializerMethodField()
    item_name = serializers.CharField(
        source="menu_item.name",
        read_only=True,
    )

    class Meta:
        model = CartItem
        fields = (
            "id",
            "menu_item",
            "item_name",
            "price",
            "quantity",
            "subtotal",
            "image_url",
        )

    def get_image_url(self, obj):
        image = obj.menu_item.image
        if not image:
            return None

        request = self.context.get("request")
        try:
            url = image.url
        except (ValueError, OSError):
            return None

        return request.build_absolute_uri(url) if request else url


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