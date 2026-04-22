import { apiFetch } from "./client";
import type { Booking, BookingCreatePayload } from "./types";

// Re-export the Booking type so existing imports from './bookings' keep working
export type { Booking, BookingCreatePayload } from "./types";

export const getMyBookings = (): Promise<Booking[]> =>
    apiFetch<Booking[]>("/api/bookings/me/");

export const getAllBookings = (): Promise<Booking[]> =>
    apiFetch<Booking[]>("/api/bookings/");

export const createBooking = (payload: BookingCreatePayload): Promise<Booking> =>
    apiFetch<Booking>("/api/bookings/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
