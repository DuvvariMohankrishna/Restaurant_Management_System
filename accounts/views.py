from drf_spectacular.utils import extend_schema

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, ProfileSerializer


@extend_schema(
    tags=["Accounts"],
    summary="Register a new customer",
    description="Create a new customer account.",
)
class RegisterAPIView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@extend_schema(
    tags=["Accounts"],
    summary="Get user profile",
    description="Retrieve the profile of the currently authenticated user.",
    responses=ProfileSerializer,
)
class ProfileAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        serializer = ProfileSerializer(request.user)

        return Response(serializer.data)