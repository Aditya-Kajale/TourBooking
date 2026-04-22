from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    # Nested read-only tour details so the frontend doesn't need a second request
    tour_title = serializers.CharField(source='tour.title', read_only=True)
    tour_location = serializers.CharField(source='tour.location', read_only=True)
    tour_date = serializers.DateField(source='tour.date', read_only=True)
    tour_image = serializers.ImageField(source='tour.image', read_only=True)
    tour_price = serializers.DecimalField(source='tour.price', max_digits=10, decimal_places=2, read_only=True)
    tour_category = serializers.CharField(source='tour.category', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'tour', 'participants', 'total_price', 'date',
            'payment_status', 'payment_method', 'paid_at', 'status', 'created_at',
            'participant_details',
            # nested tour fields
            'tour_title', 'tour_location', 'tour_date', 'tour_image', 'tour_price', 'tour_category',
        ]
        read_only_fields = ['id', 'created_at', 'user']
