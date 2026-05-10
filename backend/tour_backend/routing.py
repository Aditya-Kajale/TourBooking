"""
WebSocket routing configuration for Django Channels.
Maps WebSocket connections to appropriate consumers.
"""

from django.urls import re_path
from bookings.consumers import SeatUpdateConsumer

websocket_urlpatterns = [
    re_path(r'ws/seats/(?P<tour_id>[^/]+)/$', SeatUpdateConsumer.as_asgi()),
]
