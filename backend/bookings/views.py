from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, BasePermission
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, BaseAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Booking
from .serializers import BookingSerializer
from rest_framework.exceptions import PermissionDenied
from tours.models import Tour


class DevHeaderAuthentication(BaseAuthentication):
    """
    Custom authentication to trust X-DEV-USER header in local development.
    Reused from tours app for consistency.
    """
    def authenticate(self, request):
        if not settings.DEBUG:
            return None
        dev_user = request.META.get('HTTP_X_DEV_USER')
        if not dev_user:
            return None

        User = get_user_model()
        try:
            user = User.objects.get(pk=dev_user)
            return (user, None)
        except Exception:
            try:
                user = User.objects.get(username=dev_user)
                return (user, None)
            except Exception:
                pass
        return None


class DevHeaderAllowPermission(BasePermission):
    """Allow all methods if X-DEV-USER header present in DEBUG mode."""
    def has_permission(self, request, view):
        if settings.DEBUG and request.META.get('HTTP_X_DEV_USER'):
            return True
        return IsAuthenticatedOrReadOnly().has_permission(request, view)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [DevHeaderAllowPermission]
    authentication_classes = [DevHeaderAuthentication, SessionAuthentication, BasicAuthentication]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return bookings belonging to the authenticated user."""
        user = request.user
        qs = self.get_queryset().filter(user=user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

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
