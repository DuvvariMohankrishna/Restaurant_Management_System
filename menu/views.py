# from django.shortcuts 
# import render


# # Create your views here.
from rest_framework import generics
from rest_framework.permissions import AllowAny
from.models import Category
from .serializers import CategorySerializer

class CategoryListCreateAPIView(generics.ListCreateAPIView):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer
    permission_classes=[AllowAny]

class CategoryRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer
    permission_classes=[AllowAny]