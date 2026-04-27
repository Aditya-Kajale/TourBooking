import logging
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F, Value, IntegerField
from django.db.models.functions import Coalesce
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


class TourViewSet(viewsets.ModelViewSet):
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
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