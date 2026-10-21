from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [

    # Django Admin
    path(
        "admin/",
        admin.site.urls,
    ),

    # Accounts APIs
    path(
        "api/v1/accounts/",
        include("accounts.urls"),
    ),

    # Menu APIs
    path(
        "api/v1/",
        include("menu.urls"),
    ),

    # Cart APIs
    path(
        "api/v1/cart/",
        include("cart.urls"),
    ),

    # Orders APIs
    path(
        "api/v1/orders/",
        include("orders.urls"),
    ),

    # Reservations APIs
    path(
        "api/v1/reservations/",
        include("reservations.urls"),
    ),

    # Payments APIs
    path(
        "api/v1/payments/",
        include("payments.urls"),
    ),

    # Dashboard APIs
    path(
        "api/v1/dashboard/",
        include("dashboard.urls"),
    ),

    # OpenAPI Schema
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    # Swagger Documentation
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
    path(
    "",
    include(
        ("frontend.urls", "frontend"),
        namespace="frontend",
    ),
),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
