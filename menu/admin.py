from django.contrib import admin

from .models import Category
from .models import MenuItems
# or
# from .models import Category, MenuItems

# Register your models here.
admin.site.register(Category)
admin.site.register(MenuItems)
