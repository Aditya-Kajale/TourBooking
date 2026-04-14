from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Booking
from .serializers import BookingSerializer
from rest_framework.exceptions import PermissionDenied
from tours.models import Tour


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        tour = None
        try:
            tour = Tour.objects.get(pk=serializer.validated_data.get('tour').id)
        except Exception:
            # if serializer provides tour instance or id, ignore here
            tour = None

        # Prevent guide from booking their own tour
        if tour is not None and hasattr(self.request, 'user') and tour.created_by == self.request.user:
            raise PermissionDenied('Guides cannot book their own tours')

        # compute total price if not provided
        participants = serializer.validated_data.get('participants', 1)
        if 'total_price' not in serializer.validated_data or not serializer.validated_data.get('total_price'):
            if tour is not None:
                serializer.save(user=self.request.user, total_price=(tour.price * participants), date=serializer.validated_data.get('date') or tour.date)
                return

        serializer.save(user=self.request.user)
