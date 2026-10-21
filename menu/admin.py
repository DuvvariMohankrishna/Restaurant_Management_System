from django.contrib import admin
from django.utils.html import format_html

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
                  "image_preview",
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
                     "updated_at",
                     "image_preview",)

    fields = ("category", "name", "description", "price", "image", "image_preview",
              "is_available", "preparation_time", "created_at", "updated_at")

    @admin.display(description="Current image")
    def image_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="width:100px;height:72px;object-fit:cover;border-radius:8px;" />',
                obj.image.url,
            )
        return "No image uploaded"
