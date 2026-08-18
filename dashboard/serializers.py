from rest_framework import serializers


class CustomerStatsSerializer(serializers.Serializer):

    total = serializers.IntegerField()


class MenuStatsSerializer(serializers.Serializer):

    total_items = serializers.IntegerField()
    available_items = serializers.IntegerField()


class OrderStatsSerializer(serializers.Serializer):

    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    confirmed = serializers.IntegerField()
    delivered = serializers.IntegerField()
    cancelled = serializers.IntegerField()


class RevenueStatsSerializer(serializers.Serializer):

    total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )


class ReservationStatsSerializer(serializers.Serializer):

    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    confirmed = serializers.IntegerField()


class PaymentStatsSerializer(serializers.Serializer):

    successful = serializers.IntegerField()
    pending = serializers.IntegerField()
    failed = serializers.IntegerField()


class DashboardDataSerializer(serializers.Serializer):

    customers = CustomerStatsSerializer()
    menu = MenuStatsSerializer()
    orders = OrderStatsSerializer()
    revenue = RevenueStatsSerializer()
    reservations = ReservationStatsSerializer()
    payments = PaymentStatsSerializer()


class DashboardResponseSerializer(serializers.Serializer):

    success = serializers.BooleanField()
    message = serializers.CharField()
    data = DashboardDataSerializer()