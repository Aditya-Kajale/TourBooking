from rest_framework import serializers
import nh3
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = [
            'id',
            'user',
            'username',
            'tour',
            'rating',
            'comment',
            'is_approved',
            'created_at']
        read_only_fields = ['id', 'created_at', 'user', 'is_approved']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        # Sanitize HTML to prevent XSS
        return nh3.clean(value) if value else value
