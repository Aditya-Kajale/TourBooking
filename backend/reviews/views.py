from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user or request.user.is_staff


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsAuthorOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        queryset = Review.objects.all().order_by('-created_at')
        tour_id = self.request.query_params.get('tour')
        if tour_id:
            queryset = queryset.filter(tour_id=tour_id)

        # Only staff can see unapproved reviews
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAdminUser])
    def moderate(self, request, pk=None):
        review = self.get_object()
        is_approved = request.data.get('is_approved')
        if is_approved is not None:
            review.is_approved = is_approved
            review.save()
            return Response({'status': 'review moderated',
                            'is_approved': review.is_approved})
        return Response({'error': 'is_approved field required'},
                        status=status.HTTP_400_BAD_REQUEST)
