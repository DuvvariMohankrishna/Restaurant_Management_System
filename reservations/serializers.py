from django.utils import timezone

from rest_framework import serializers

from .models import Reservation, ReservationStatus


class ReservationSerializer(serializers.ModelSerializer):

    class Meta:

        model = Reservation

        fields = (
            "id",
            "user",
            "reservation_date",
            "reservation_time",
            "table_number",
            "number_of_guests",
            "status",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "user",
            "status",
            "created_at",
            "updated_at",
        )

    def validate_table_number(self, value):

        if value < 1:

            raise serializers.ValidationError(
                "Table number must be at least 1."
            )

        return value

    def validate_number_of_guests(self, value):

        if value < 1:

            raise serializers.ValidationError(
                "Number of guests must be at least 1."
            )

        if value > 20:

            raise serializers.ValidationError(
                "Number of guests cannot exceed 20."
            )

        return value

    def validate(self, attrs):

        reservation_date = attrs.get(
            "reservation_date"
        )

        reservation_time = attrs.get(
            "reservation_time"
        )

        now = timezone.localtime()

        if reservation_date < now.date():

            raise serializers.ValidationError(
                {
                    "reservation_date": (
                        "Reservation date cannot be "
                        "in the past."
                    )
                }
            )

        if (
            reservation_date == now.date()
            and reservation_time <= now.time()
        ):

            raise serializers.ValidationError(
                {
                    "reservation_time": (
                        "Reservation time must be "
                        "in the future."
                    )
                }
            )

        return attrs


class ReservationStatusUpdateSerializer(
    serializers.Serializer
):

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