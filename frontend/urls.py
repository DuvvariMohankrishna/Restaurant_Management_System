from django.urls import path

from .views import (
    HomeView,
    LoginView,
    RegisterView,
    CartView,
    ReservationsView,
    OrdersView,
    menu_view,
)


urlpatterns = [

    path(
        "",
        HomeView.as_view(),
        name="home",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "menu/",
        menu_view,
        name="menu",
    ),

    path(
        "cart/",
        CartView.as_view(),
        name="cart",
    ),

    path(
        "reservations/",
        ReservationsView.as_view(),
        name="reservations",
    ),

    path(
        "orders/",
        OrdersView.as_view(),
        name="orders",
    ),

]