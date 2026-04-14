from rest_framework import serializers
from .models import Tour

class TourSerializer(serializers.ModelSerializer):
    # REMOVE: created_by_name = serializers.ReadOnlyField(...)

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
    'created_at'
]
        read_only_fields = ['created_by']