from django.views.generic import TemplateView
from django.shortcuts import render


class HomeView(TemplateView):

    template_name = "frontend/home.html"


class LoginView(TemplateView):

    template_name = "frontend/login.html"


class RegisterView(TemplateView):

    template_name = "frontend/register.html"


class CartView(TemplateView):

    template_name = "frontend/cart.html"


def menu_view(request):

    return render(
        request,
        "frontend/menu.html",
    )


class ReservationsView(TemplateView):

    template_name = "frontend/reservations.html"


class OrdersView(TemplateView):

    template_name = "frontend/orders.html"