# from django.shortcuts import render

# # Create your views here.

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import ProfileSerializer
from .serializers import RegisterSerializer

class RegisterAPIView(generics.CreateAPIView):
    serializer_class=RegisterSerializer
    permission_classes=[AllowAny]
class ProfileAPIView(APIView):
    permission_classes=[AllowAny]
    def get(self,request):
        serializer=ProfileSerializer(request.user)
        return Response(serializer.data)



    
