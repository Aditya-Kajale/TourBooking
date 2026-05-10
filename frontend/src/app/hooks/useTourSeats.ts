import { useState, useEffect } from 'react';
import { useWebSocket, type SeatData } from './useWebSocket';

interface SeatInfo {
  max_people: number;
  bookings_count: number;
  is_housefull: boolean;
  available_seats: number;
}

export function useTourSeats(tourId?: string | number) {
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Use WebSocket hook for real-time updates
  const tourIdStr = tourId ? String(tourId) : null;
  const { seatData, error: wsError } = useWebSocket(tourIdStr, {
    onError: (errorMsg) => {
      setError(new Error(errorMsg));
    }
  });

  // Convert WebSocket seat data to the format expected by components
  useEffect(() => {
    if (seatData) {
      setSeatInfo({
        max_people: seatData.max_people,
        bookings_count: seatData.bookings_count,
        is_housefull: seatData.is_housefull,
        available_seats: seatData.available_seats,
      });
    }
  }, [seatData]);

  return { seatInfo, error };
}

