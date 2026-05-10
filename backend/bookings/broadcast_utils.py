"""
Utility functions for broadcasting real-time updates via Channels.
"""

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def broadcast_seat_update(tour_id):
    """
    Broadcast seat update to all connected WebSocket clients for a specific tour.
    Call this whenever bookings are created, confirmed, or cancelled.
    """
    from tours.models import Tour
    from bookings.models import Booking

    try:
        tour = Tour.objects.get(id=tour_id)
        bookings_count = Booking.objects.filter(
            tour_id=tour_id,
            status__in=['pending', 'confirmed']
        ).count()

        available_seats = tour.max_people - bookings_count
        is_housefull = available_seats <= 0

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'tour_{tour_id}',
            {
                'type': 'seat_update',
                'data': {
                    'tour_id': str(tour_id),
                    'max_people': tour.max_people,
                    'bookings_count': bookings_count,
                    'available_seats': max(0, available_seats),
                    'is_housefull': is_housefull,
                }
            }
        )
    except Exception as e:
        # Log error but don't fail the request if broadcast fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Failed to broadcast seat update for tour {tour_id}: {str(e)}')


def broadcast_booking_confirmation(tour_id, booking_data):
    """
    Broadcast booking confirmation event to all connected clients.
    """
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'tour_{tour_id}',
            {
                'type': 'booking_confirmed',
                'data': {
                    'tour_id': str(tour_id),
                    'booking': booking_data,
                    'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now()),
                }
            }
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Failed to broadcast booking confirmation for tour {tour_id}: {str(e)}')
