from rest_framework import serializers
from django.db.models import Sum
from .models import Tour

class TourSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    bookings_count = serializers.SerializerMethodField()
    is_housefull = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        try:
            return obj.created_by.username
        except Exception:
            return None

    def get_bookings_count(self, obj):
        """Return total number of PEOPLE booked (sum of participants), not row count."""
        try:
            result = obj.booking_set.aggregate(total=Sum('participants'))
            return result['total'] or 0
        except Exception:
            return 0

    def get_is_housefull(self, obj):
        """Tour is housefull when total participants booked >= max_people."""
        try:
            result = obj.booking_set.aggregate(total=Sum('participants'))
            total_booked = result['total'] or 0
            return total_booked >= obj.max_people
        except Exception:
            return False

    class Meta:
        model = Tour
        fields = [
    'id',
    'title',
    'location',
    'description',
    'date',
    'price',
    'max_people',
    'category',
    'duration',
    'image',
    'created_by',
    'created_by_name',
    'bookings_count',
    'is_housefull',
    'created_at'
]
        read_only_fields = ['created_by', 'created_by_name', 'bookings_count', 'is_housefull']