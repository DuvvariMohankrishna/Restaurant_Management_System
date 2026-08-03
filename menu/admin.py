from django.contrib import admin

from .models import Category
from .models import MenuItems
# or
# from .models import Category, MenuItems

# Register your models here.
# admin.site.register(Category)
# admin.site.register(MenuItems)
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display=("id",
                  "name",
                  "is_active",
                  "created_at",
                  )
    search_fields=("name",)
    list_filter=("is_active",)
    ordering=("name",)
    random_fields=("created_at",
                   "updated_at",)
@admin.register(MenuItems)
class MenuItemAdmin(admin.ModelAdmin):
    list_display=("id",
                  "name",
                  "category",
                  "price",
                  "is_available",
                  "preparation_time",)
    list_filter=("category",
                 "is_available",)
    search_fields=("name",
                   "description",)
    ordering=("name",)
    readonly_fields=("created_at",
                     "updated_at",)
