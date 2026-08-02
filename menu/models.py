from django.db import models

# Create your models here.
class Category(models.Model):
    """ Represents a  food category """
    name=models.CharField(max_length=100,unique=True,db_index=True)
    description = models.TextField(blank=True)
    is_active=models.BooleanField(default=True)
    created_at= models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MenuItems(models.Model):
    """ Represents a fod item available in the restaurant"""
    category=models.ForeignKey(Category,on_delete=models.PROTECT,related_name="menu_items")
    name=models.CharField(max_length=100)
    description=models.TextField(blank=True)
    price=models.DecimalField(max_digits=8,decimal_places=2)
    image=models.ImageField(upload_to="menu/",blank=True,null=True)
    is_available=models.BooleanField(default=True)
    preparation_time=models.PositiveIntegerField(help_text="Preperation time in minutes")
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name