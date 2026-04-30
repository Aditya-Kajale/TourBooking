import logging
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F, Value, IntegerField
from django.db.models.functions import Coalesce
from django.http import StreamingHttpResponse
from asgiref.sync import sync_to_async
import asyncio
import json
from .models import Tour
from .serializers import TourSerializer

logger = logging.getLogger(__name__)


class TourPagination(PageNumberPagination):
    """Cursor-based pagination for large tour datasets."""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class IsOwnerOrReadOnly(BasePermission):
    """Object-level permission: only owners may edit/delete."""
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return (
            request.user
            and request.user.is_authenticated
            and str(obj.created_by_id) == str(request.user.id)
        )

class IsGuide(BasePermission):
    """Permission: only users with is_guide=True can create tours."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_authenticated and request.user.is_guide


class TourViewSet(viewsets.ModelViewSet):
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly, IsGuide]
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    pagination_class = TourPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'location', 'category']
    ordering_fields = ['date', 'price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Tour.objects.all()

        # ── Server-side filters ──────────────────────────────────
        params = self.request.query_params

        # Filter by exact date
        date_param = params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)

        # Filter by category
        category = params.get('category')
        if category and category != 'All':
            qs = qs.filter(category=category)

        # Filter: upcoming only (default for discovery)
        if params.get('upcoming') == 'true':
            from datetime import date
            qs = qs.filter(date__gte=date.today())

        # Exclude own tours (guide shouldn't see their own in discovery)
        exclude_user = params.get('exclude_user')
        if exclude_user:
            qs = qs.exclude(created_by_id=exclude_user)

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        logger.info('Tour deleted id=%s by user=%s', instance.id, request.user)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

@sync_to_async
def get_tour_seat_info(tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
        booked_agg = tour.booking_set.exclude(status='cancelled').aggregate(total=Sum('participants'))
        booked_count = booked_agg['total'] or 0
        return {
            'max_people': tour.max_people,
            'bookings_count': booked_count,
            'is_housefull': booked_count >= tour.max_people,
            'available_seats': max(tour.max_people - booked_count, 0)
        }
    except Tour.DoesNotExist:
        return None

async def tour_seats_stream(request, pk):
    """
    Server-Sent Events endpoint that pushes real-time updates for seat availability.
    """
    async def event_stream():
        last_state = None
        while True:
            current_state = await get_tour_seat_info(pk)
            if current_state is None:
                yield "event: error\ndata: Tour not found\n\n"
                break
            
            if current_state != last_state:
                yield f"data: {json.dumps(current_state)}\n\n"
                last_state = current_state
            
            await asyncio.sleep(2)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response