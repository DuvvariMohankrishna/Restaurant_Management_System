from django.urls import path

from .views import (
    CategoryListCreateAPIView,
    CategoryRetrieveUpdateDestroyAPIView,
    MenuItemListCreateAPIView,
    MenuItemRetrieveUpdateDestroyAPIView,
)


urlpatterns = [
    path(
        "categories/",
        CategoryListCreateAPIView.as_view(),
        name="category-list-create",
    ),

    path(
        "categories/<int:pk>/",
        CategoryRetrieveUpdateDestroyAPIView.as_view(),
        name="category-detail",
    ),

    path(
        "menu-items/",
        MenuItemListCreateAPIView.as_view(),
        name="menu-item-list-create",
    ),

    path(
        "menu-items/<int:pk>/",
        MenuItemRetrieveUpdateDestroyAPIView.as_view(),
        name="menu-item-detail",
    ),
]