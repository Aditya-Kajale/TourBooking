"""
WebSocket consumers for real-time seat updates.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from tours.models import Tour
from bookings.models import Booking


class SeatUpdateConsumer(AsyncWebsocketConsumer):
    """
    Handles WebSocket connections for real-time seat updates on specific tours.
    Groups clients by tour_id and broadcasts seat availability changes.
    """

    async def connect(self):
        """Accept WebSocket connection and add to tour group."""
        self.tour_id = self.scope['url_route']['kwargs']['tour_id']
        self.group_name = f'tour_{self.tour_id}'

        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept the connection
        await self.accept()

        # Send initial seat data
        seat_data = await self.get_seat_data()
        await self.send(text_data=json.dumps({
            'type': 'initial',
            'data': seat_data
        }))

    async def disconnect(self, close_code):
        """Remove from group on disconnect."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Receive WebSocket message (currently not used for this feature,
        but kept for future extensibility).
        """
        try:
            data = json.loads(text_data)
            # Currently not processing any incoming messages
            # This could be extended for client-side actions
        except json.JSONDecodeError:
            pass

    # Event handlers for group messages

    async def seat_update(self, event):
        """
        Broadcast seat update event to all connected clients in the group.
        """
        await self.send(text_data=json.dumps({
            'type': 'seat_update',
            'data': event['data']
        }))

    async def booking_confirmed(self, event):
        """Broadcast booking confirmation event."""
        await self.send(text_data=json.dumps({
            'type': 'booking_confirmed',
            'data': event['data']
        }))

    # Utility methods

    @sync_to_async
    def get_seat_data(self):
        """Fetch current seat availability for the tour."""
        try:
            tour = Tour.objects.get(id=self.tour_id)
            bookings_count = Booking.objects.filter(
                tour_id=self.tour_id,
                status__in=['pending', 'confirmed']
            ).count()

            available_seats = tour.max_people - bookings_count
            is_housefull = available_seats <= 0

            return {
                'tour_id': str(self.tour_id),
                'max_people': tour.max_people,
                'bookings_count': bookings_count,
                'available_seats': max(0, available_seats),
                'is_housefull': is_housefull,
            }
        except Tour.DoesNotExist:
            return {
                'error': 'Tour not found',
                'tour_id': str(self.tour_id),
            }
