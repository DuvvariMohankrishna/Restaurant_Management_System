from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    class Meta:
        model = Payment

        fields = (
            "id",
            "order_number",
            "amount",
            "payment_method",
            "status",
            "transaction_id",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "order_number",
            "amount",
            "payment_method",
            "status",
            "transaction_id",
            "created_at",
            "updated_at",
        )