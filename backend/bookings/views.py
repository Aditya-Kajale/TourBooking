import logging
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Sum
from .models import Booking
from .serializers import BookingSerializer
from tours.models import Tour

logger = logging.getLogger(__name__)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    @action(detail=False, methods=['get'],
            permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return bookings belonging to the authenticated user."""
        qs = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """
        Create booking with:
        - Atomic overbooking prevention (select_for_update)
        - Guide self-booking prevention
        - Auto price calculation
        """
        tour_instance = serializer.validated_data.get('tour')
        if not tour_instance:
            raise ValidationError({'tour': 'Tour is required.'})

        participants = serializer.validated_data.get('participants', 1)
        if participants < 1:
            raise ValidationError({'participants': 'Must be at least 1.'})

        # Prevent guide from booking their own tour
        if tour_instance.created_by_id == self.request.user.id:
            raise PermissionDenied('Guides cannot book their own tours.')

        # ── Atomic overbooking prevention ────────────────────────
        with transaction.atomic():
            # Lock the tour row to prevent race conditions
            tour = Tour.objects.select_for_update().get(pk=tour_instance.pk)

            booked_agg = tour.booking_set.exclude(
                status='cancelled'
            ).aggregate(total=Sum('participants'))
            current_booked = booked_agg['total'] or 0

            available = tour.max_people - current_booked
            if participants > available:
                raise ValidationError({
                    'participants': f'Only {available} seat(s) available. You requested {participants}.'
                })

            # Compute total price if not provided
            total_price = serializer.validated_data.get('total_price')
            if not total_price:
                total_price = tour.price * participants

            booking_date = serializer.validated_data.get('date') or tour.date

            serializer.save(
                user=self.request.user,
                total_price=total_price,
                date=booking_date,
            )

        logger.info(
            'Booking created tour=%s user=%s participants=%d',
            tour.id, self.request.user, participants
        )
