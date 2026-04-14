from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'user', 'tour', 'participants', 'total_price', 'date', 'payment_status', 'payment_method', 'paid_at', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']
