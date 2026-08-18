from rest_framework import serializers
from .models import Category, MenuItems


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = "__all__"


class MenuItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = MenuItems
        fields = "__all__"