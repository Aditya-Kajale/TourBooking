import { useState, useEffect } from 'react';
import { API_BASE } from '../../api/client';

interface SeatInfo {
  max_people: number;
  bookings_count: number;
  is_housefull: boolean;
  available_seats: number;
}

export function useTourSeats(tourId?: string | number) {
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tourId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      // Connect to the Server-Sent Events endpoint
      eventSource = new EventSource(`${API_BASE}/api/tours/${tourId}/stream_seats/`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setSeatInfo(data);
          setError(null);
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error", err);
        eventSource?.close();
        
        // Attempt to reconnect after 5 seconds if connection drops
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [tourId]);

  return { seatInfo, error };
}
