from rest_framework import serializers
from django.db.models import Sum, Avg
from .models import Tour


class TourSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    bookings_count = serializers.SerializerMethodField()
    is_housefull = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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

    def get_available_seats(self, obj):
        """Return remaining seats: max_people - total participants booked."""
        try:
            result = obj.booking_set.aggregate(total=Sum('participants'))
            total_booked = result['total'] or 0
            remaining = obj.max_people - total_booked
            return max(remaining, 0)
        except Exception:
            return obj.max_people

    def get_average_rating(self, obj):
        try:
            # Only count approved reviews
            result = obj.review_set.filter(
                is_approved=True).aggregate(
                avg=Avg('rating'))
            return round(result['avg'], 1) if result['avg'] else 0
        except Exception:
            return 0

    def get_review_count(self, obj):
        try:
            return obj.review_set.filter(is_approved=True).count()
        except Exception:
            return 0

    def validate_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError(
                "Tour date cannot be in the past.")
        return value

    def validate_image(self, value):
        if value:
            # Check size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Image size cannot exceed 5MB.")

            # Check file extension
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
                raise serializers.ValidationError(
                    "Unsupported image format. Use JPEG, PNG, or WEBP.")
        return value

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
            'available_seats',
            'average_rating',
            'review_count',
            'created_at'
        ]
        read_only_fields = [
            'created_by',
            'created_by_name',
            'bookings_count',
            'is_housefull',
            'available_seats',
            'average_rating',
            'review_count']
