import { useState, useEffect, useCallback } from 'react';
import type { Booking, BookingCreatePayload } from '../../api/types';
import { getMyBookings, createBooking as apiCreateBooking } from '../../api/bookings';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = useCallback(async (payload: BookingCreatePayload) => {
    const newBooking = await apiCreateBooking(payload);
    // Append to local state for immediate UI update
    setBookings((prev) => [...prev, newBooking]);
    return newBooking;
  }, []);

  return { bookings, loading, error, fetchBookings, createBooking };
}
