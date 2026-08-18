from drf_spectacular.utils import extend_schema

from rest_framework import generics

from .models import Category, MenuItems
from .serializers import CategorySerializer, MenuItemSerializer


@extend_schema(
    tags=["Categories"],
    summary="List or create categories",
    description="Retrieve all categories or create a new menu category.",
)
class CategoryListCreateAPIView(generics.ListCreateAPIView):

    queryset = Category.objects.all()
    serializer_class = CategorySerializer


@extend_schema(
    tags=["Categories"],
    summary="Manage a category",
    description=(
        "Retrieve, update, partially update, "
        "or delete a specific category."
    ),
)
class CategoryRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = Category.objects.all()
    serializer_class = CategorySerializer


@extend_schema(
    tags=["Menu Items"],
    summary="List or create menu items",
    description="Retrieve all menu items or create a new menu item.",
)
class MenuItemListCreateAPIView(generics.ListCreateAPIView):

    queryset = MenuItems.objects.select_related("category").all()
    serializer_class = MenuItemSerializer


@extend_schema(
    tags=["Menu Items"],
    summary="Manage a menu item",
    description=(
        "Retrieve, update, partially update, "
        "or delete a specific menu item."
    ),
)
class MenuItemRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = MenuItems.objects.select_related("category").all()
    serializer_class = MenuItemSerializer