from django.shortcuts import get_object_or_404

from django_filters.rest_framework import DjangoFilterBackend

from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)

from rest_framework import filters, generics, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin

from .models import Reservation, ReservationStatus
from .serializers import ReservationSerializer


class ReservationStatusUpdateSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=[
            ReservationStatus.CONFIRMED,
            ReservationStatus.COMPLETED,
            ReservationStatus.CANCELLED,
        ]
    )


class CancelReservationResponseSerializer(
    serializers.Serializer
):

    message = serializers.CharField()

    reservation = ReservationSerializer()


class ReservationStatusUpdateResponseSerializer(
    serializers.Serializer
):

    message = serializers.CharField()

    reservation = ReservationSerializer()


@extend_schema(
    tags=["Reservations"],
    summary="List or create reservations",
    description=(
        "Retrieve the authenticated user's reservations "
        "or create a new reservation."
    ),
    request=ReservationSerializer,
    responses={
        200: ReservationSerializer(many=True),
        201: OpenApiResponse(
            response=ReservationSerializer,
            description="Reservation created successfully.",
        ),
    },
)
class ReservationListCreateAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        reservations = (
            Reservation.objects
            .filter(user=request.user)
            .order_by(
                "-reservation_date",
                "-reservation_time",
            )
        )

        paginator = PageNumberPagination()

        paginator.page_size = 10

        paginated_reservations = paginator.paginate_queryset(
            reservations,
            request,
        )

        serializer = ReservationSerializer(
            paginated_reservations,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):

        serializer = ReservationSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation_date = serializer.validated_data[
            "reservation_date"
        ]

        reservation_time = serializer.validated_data[
            "reservation_time"
        ]

        table_number = serializer.validated_data[
            "table_number"
        ]

        table_already_booked = Reservation.objects.filter(
            reservation_date=reservation_date,
            reservation_time=reservation_time,
            table_number=table_number,
            status__in=[
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
            ],
        ).exists()

        if table_already_booked:

            return Response(
                {
                    "message": (
                        "This table is already reserved "
                        "for the selected date and time."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation = serializer.save(
            user=request.user,
            status=ReservationStatus.PENDING,
        )

        return Response(
            {
                "message": (
                    "Reservation created successfully."
                ),
                "reservation": ReservationSerializer(
                    reservation
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Reservations"],
    summary="Reservation details",
    description=(
        "Retrieve a specific reservation belonging "
        "to the authenticated user."
    ),
    responses=ReservationSerializer,
)
class ReservationDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        reservation = get_object_or_404(
            Reservation,
            id=pk,
            user=request.user,
        )

        serializer = ReservationSerializer(
            reservation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Reservations"],
    summary="Cancel reservation",
    description=(
        "Cancel an eligible reservation belonging "
        "to the authenticated user."
    ),
    request=None,
    responses={
        200: CancelReservationResponseSerializer,
    },
)
class CancelReservationAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        reservation = get_object_or_404(
            Reservation,
            id=pk,
            user=request.user,
        )

        if reservation.status in [
            ReservationStatus.COMPLETED,
            ReservationStatus.CANCELLED,
        ]:

            return Response(
                {
                    "message": (
                        f"Reservation cannot be cancelled "
                        f"because its current status is "
                        f"{reservation.status}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.status = ReservationStatus.CANCELLED

        reservation.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ReservationSerializer(
            reservation
        )

        return Response(
            {
                "message": (
                    "Reservation cancelled successfully."
                ),
                "reservation": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Reservations"],
    summary="List all reservations",
    description=(
        "Allow staff or administrators to view "
        "all reservations."
    ),
    responses=ReservationSerializer(many=True),
)
class AdminReservationListAPIView(APIView):

    permission_classes = [IsStaffOrAdmin]

    def get(self, request):

        reservations = (
            Reservation.objects
            .select_related("user")
            .order_by(
                "-reservation_date",
                "-reservation_time",
            )
        )

        serializer = ReservationSerializer(
            reservations,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Reservations"],
    summary="Update reservation status",
    description=(
        "Allow staff or administrators to update "
        "a reservation status according to the "
        "allowed status transitions."
    ),
    request=ReservationStatusUpdateSerializer,
    responses={
        200: ReservationStatusUpdateResponseSerializer,
    },
)
class AdminReservationStatusAPIView(APIView):

    permission_classes = [IsStaffOrAdmin]

    def patch(self, request, pk):

        serializer = ReservationStatusUpdateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        reservation = get_object_or_404(
            Reservation,
            id=pk,
        )

        new_status = serializer.validated_data[
            "status"
        ]

        current_status = reservation.status

        allowed_transitions = {
            ReservationStatus.PENDING: [
                ReservationStatus.CONFIRMED,
                ReservationStatus.CANCELLED,
            ],
            ReservationStatus.CONFIRMED: [
                ReservationStatus.COMPLETED,
                ReservationStatus.CANCELLED,
            ],
            ReservationStatus.COMPLETED: [],
            ReservationStatus.CANCELLED: [],
        }

        if new_status not in allowed_transitions.get(
            current_status,
            [],
        ):

            return Response(
                {
                    "message": (
                        f"Cannot change reservation status "
                        f"from {current_status} to "
                        f"{new_status}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.status = new_status

        reservation.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        reservation_serializer = ReservationSerializer(
            reservation
        )

        return Response(
            {
                "message": (
                    "Reservation status updated successfully."
                ),
                "reservation": (
                    reservation_serializer.data
                ),
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Reservations"],
    summary="Check table availability",
    description=(
        "Check whether a table is available for "
        "the specified date and time."
    ),
    parameters=[
        OpenApiParameter(
            name="reservation_date",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            name="reservation_time",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            name="table_number",
            type=int,
            location=OpenApiParameter.QUERY,
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description=(
                "Table availability retrieved successfully."
            )
        ),
    },
)
class ReservationAvailabilityAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        reservation_date = request.query_params.get(
            "reservation_date"
        )

        reservation_time = request.query_params.get(
            "reservation_time"
        )

        table_number = request.query_params.get(
            "table_number"
        )

        if not all([
            reservation_date,
            reservation_time,
            table_number,
        ]):

            return Response(
                {
                    "message": (
                        "reservation_date, "
                        "reservation_time, and "
                        "table_number are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        table_already_booked = Reservation.objects.filter(
            reservation_date=reservation_date,
            reservation_time=reservation_time,
            table_number=table_number,
            status__in=[
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
            ],
        ).exists()

        return Response(
            {
                "table_number": table_number,
                "reservation_date": reservation_date,
                "reservation_time": reservation_time,
                "available": not table_already_booked,
            },
            status=status.HTTP_200_OK,
        )


class ReservationManagementAPIView(
    generics.ListAPIView
):

    permission_classes = [IsStaffOrAdmin]

    serializer_class = ReservationSerializer

    queryset = (
        Reservation.objects
        .select_related("user")
        .all()
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "reservation_date",
        "table_number",
    ]

    search_fields = [
        "user__username",
        "user__email",
    ]

    ordering_fields = [
        "reservation_date",
        "reservation_time",
        "created_at",
        "number_of_guests",
        "table_number",
    ]

    ordering = [
        "-reservation_date",
        "-reservation_time",
    ]