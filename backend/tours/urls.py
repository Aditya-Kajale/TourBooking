from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import TourViewSet, tour_seats_stream

router = DefaultRouter()
router.register(r'', TourViewSet, basename='tours')

urlpatterns = [
    path('<uuid:pk>/stream_seats/', tour_seats_stream, name='tour_seats_stream'),
] + router.urls