# Real-Time Seat Updates Implementation

## Overview

This document describes the implementation of real-time seat availability updates using Django Channels and WebSockets. The system provides live seat counts to all connected clients, allowing users to see available seats on a tour instantly as bookings are made or cancelled.

## Why WebSockets Over SSE?

The original implementation used Server-Sent Events (SSE) for real-time updates, but SSE has limitations:
- **One connection per client**: Each client maintains a persistent HTTP connection
- **Connection pool exhaustion**: Under high traffic, server connection pools can be exhausted
- **Scalability issues**: Difficult to scale beyond a few thousand concurrent users

WebSockets address these issues:
- **Bidirectional communication**: More efficient for high-frequency updates
- **Lower overhead**: Binary protocol vs HTTP streaming
- **Better scalability**: Can handle many more concurrent connections with Redis channel layer

## Architecture

### Backend Components

#### 1. **Django Channels Setup** (`tour_backend/settings.py`)
```python
INSTALLED_APPS = [
    'daphne',  # ASGI server (must be first)
    ...
    'channels',  # Channels support
    ...
]

ASGI_APPLICATION = 'tour_backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],  # Redis server
            'capacity': 1500,
            'expiry': 10,
        },
    },
}
```

#### 2. **ASGI Configuration** (`tour_backend/asgi.py`)
Configures protocol routing for HTTP and WebSocket connections:
```python
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(tour_backend.routing.websocket_urlpatterns)
    ),
})
```

#### 3. **WebSocket Consumer** (`bookings/consumers.py`)
Handles WebSocket connections and broadcasts:
- **SeatUpdateConsumer**: Accepts WebSocket connections, manages groups by tour_id
- **Groups by tour**: Clients connect to `tour_{tour_id}` group
- **Message types**: `seat_update` (real-time changes), `booking_confirmed` (confirmation events)
- **Initial data**: Sends current seat count when client connects

```python
class SeatUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join tour group and send initial seat data
        
    async def seat_update(self, event):
        # Broadcast seat update to client
```

#### 4. **Routing Configuration** (`tour_backend/routing.py`)
Maps WebSocket URL patterns to consumers:
```python
websocket_urlpatterns = [
    re_path(r'ws/seats/(?P<tour_id>[^/]+)/$', SeatUpdateConsumer.as_asgi()),
]
```

#### 5. **Broadcast Utilities** (`bookings/broadcast_utils.py`)
Helper functions to broadcast updates:
- `broadcast_seat_update(tour_id)`: Notifies all clients about seat availability change
- `broadcast_booking_confirmation(tour_id, booking_data)`: Sends confirmation events
- Called from booking views when bookings are created/cancelled

#### 6. **Booking Views Integration** (`bookings/views.py`)
Updated `perform_create()` to broadcast seat updates:
```python
def perform_create(self, serializer):
    # ... booking creation logic ...
    broadcast_seat_update(tour.id)  # Notify all clients
```

### Frontend Components

#### 1. **WebSocket Hook** (`frontend/src/hooks/useWebSocket.ts`)
Custom React hook managing WebSocket lifecycle:
```typescript
export function useWebSocket(tourId: string | null, options: UseWebSocketOptions) {
    // Returns: { connected, seatData, error, send, disconnect }
    // Handles automatic reconnection with exponential backoff
    // Parses JSON messages and filters by type
}
```

**Features**:
- Automatic reconnection (up to 5 attempts by default)
- Configurable reconnection delay (3 seconds default)
- Error callbacks for UI feedback
- Manual send/disconnect capabilities for extensibility

#### 2. **Tour Seats Hook** (`frontend/src/app/hooks/useTourSeats.ts`)
Wraps useWebSocket specifically for seat data:
```typescript
export function useTourSeats(tourId?: string | number) {
    const { seatData } = useWebSocket(tourIdStr);
    // Returns SeatInfo matching expected component format
}
```

Converts WebSocket data to component interface:
```typescript
interface SeatInfo {
    max_people: number;
    bookings_count: number;
    is_housefull: boolean;
    available_seats: number;
}
```

#### 3. **Component Integration**
- **TourDetail.tsx**: Already uses `useTourSeats()` hook for real-time updates
- **SeatBadge.tsx**: Displays seat information (no changes needed)
- Seat count updates instantly as other users book/cancel

## Data Flow

### Creating a Booking
1. User clicks "Book" in TourDetail
2. POST request to `/api/bookings/` 
3. Backend validates and creates booking
4. `perform_create()` calls `broadcast_seat_update(tour_id)`
5. Channel layer sends message to `tour_{tour_id}` group
6. All connected clients receive `seat_update` event
7. Frontend updates SeatBadge display instantly

### Client Connection
1. User visits TourDetail page
2. TourDetail renders → useTourSeats hook executes
3. useWebSocket connects to `ws://localhost:8000/ws/seats/{tour_id}/`
4. Consumer receives connection, fetches current seat data
5. Client receives `initial` message with seat counts
6. Component state updates, UI renders current availability

### Reconnection Flow
1. WebSocket connection drops (network issue, server restart)
2. `onclose` handler triggers reconnection logic
3. Waits 3 seconds, attempts to reconnect
4. Repeats up to 5 times with increasing delays
5. On success: receives updated seat data
6. On failure: displays error in UI

## Dependencies

### Backend
```
channels==4.0.0          # WebSocket/async support
daphne==4.0.0           # ASGI server (replaces WSGI)
channels-redis==4.1.0   # Redis channel layer
redis==7.4.0            # Redis client
```

### Frontend
- React 18+ (hooks support)
- TypeScript (type safety)
- No additional packages needed (WebSocket API is native)

## Database Schema

No new models needed - uses existing `Tour` and `Booking` models:
- Queries existing bookings to calculate available seats
- No state stored in database (calculated on-demand)

## Configuration

### Development Setup
Local Redis instance on `127.0.0.1:6379`:
```bash
# Start Redis (requires Redis installation)
redis-server

# Run Django with Daphne
daphne -b 127.0.0.1 -p 8000 tour_backend.asgi:application
```

### Production Setup
- Use hosted Redis (AWS ElastiCache, Redis Cloud, etc.)
- Update CHANNEL_LAYERS config with production Redis host
- Deploy Daphne with Gunicorn or similar
- Configure reverse proxy (Nginx) for WebSocket upgrade headers

## Environment Variables

Currently uses hardcoded localhost Redis. For production, could add:
```python
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
```

## Testing

### Manual Testing
1. Open tour detail in two browser tabs
2. Book a seat in tab 1
3. Tab 2 should show updated seat count instantly
4. Refresh tab 2 to verify persistence
5. Test with different tour IDs simultaneously

### Load Testing
- Open multiple tabs/windows for same tour
- Make rapid bookings
- Verify all clients update consistently
- Monitor for connection leaks or memory issues

## Error Handling

### Frontend
- Connection errors logged to console
- Error callback triggers UI notifications
- Automatic reconnection masks temporary outages
- Manual disconnect available for debugging

### Backend
- Broadcast failures logged but don't fail bookings
- Invalid tour IDs return error message to client
- Authentication via AuthMiddlewareStack
- Group cleanup on disconnect prevents memory leaks

## Security Considerations

1. **Authentication**: AuthMiddlewareStack ensures only logged-in users connect
2. **Authorization**: Consumers could validate tour access (future enhancement)
3. **Rate Limiting**: Consider implementing message rate limits per client
4. **Message Validation**: Consumers validate all incoming message data
5. **Channel Layer**: Redis should be protected (firewall, authentication)

## Backward Compatibility

- Old SSE endpoint (`/api/tours/{id}/stream_seats/`) not removed
- Clients can still fetch tour data via REST API
- WebSocket is additive, not required for functionality
- Could run both SSE and WebSocket during transition period

## Future Enhancements

1. **Presence Indicators**: Show how many users viewing tour
2. **Bidirectional Updates**: Clients request specific data via WebSocket
3. **WebAuthn Support**: Upgrade to WebSockets for booking operations
4. **Device Notifications**: Push notifications when tours fill up
5. **Metrics Collection**: Track connection count, message volume, latency
6. **Channel Layer Alternatives**: Rabbit MQ, PostgreSQL for channel layer

## Troubleshooting

### WebSocket Connection Fails
- Check Redis is running: `redis-cli ping`
- Check server is running with Daphne, not WSGI
- Check firewall allows WebSocket upgrade headers
- Verify ASGI_APPLICATION setting in settings.py

### Seat Updates Not Appearing
- Check browser console for connection errors
- Verify tour_id matches in URL and component
- Check RedisChannelLayer config in settings
- Ensure broadcast_seat_update() called after booking

### Memory Issues or Leaks
- Check group cleanup on disconnect
- Monitor Redis memory usage: `redis-cli info memory`
- Consider capacity/expiry settings in CHANNEL_LAYERS
- Profile frontend for WebSocket handler leaks

## File References

### Backend Files
- `tour_backend/settings.py` - Channels and Redis configuration
- `tour_backend/asgi.py` - ASGI application routing
- `tour_backend/routing.py` - WebSocket URL patterns
- `bookings/consumers.py` - WebSocket consumer
- `bookings/broadcast_utils.py` - Broadcast helper functions
- `bookings/views.py` - Integration with booking creation
- `requirements.txt` - Dependencies (channels, daphne, channels-redis)

### Frontend Files
- `src/hooks/useWebSocket.ts` - WebSocket connection manager
- `src/hooks/useTourSeats.ts` - Tour-specific seat data hook
- `src/app/screens/TourDetail.tsx` - Uses useTourSeats hook
- `src/app/components/SeatBadge.tsx` - Displays seat information

## Implementation Status

✅ **Completed**:
- Channels and dependencies installed
- ASGI application configured
- WebSocket consumer created
- Routing configured
- Broadcast utilities implemented
- Bookings integration complete
- Frontend hooks created
- Component integration done

🚧 **Testing Phase**:
- Manual testing of seat updates
- Load testing with multiple concurrent connections
- Reconnection scenario validation

📋 **Future Work**:
- Production Redis deployment
- Performance monitoring
- Additional client features (presence, notifications)
- Migration guide for old SSE endpoints
