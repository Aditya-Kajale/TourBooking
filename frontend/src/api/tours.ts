import { apiFetch } from "./client";
import type { Tour } from "./types";

/**
 * All tour-related API calls.
 * Identification (X-DEV-USER) and CSRF tokens are handled centrally in client.ts
 */

export const getTours = (): Promise<Tour[]> =>
    apiFetch<Tour[]>("/api/tours/");

export const createTour = (data: FormData): Promise<Tour> =>
    apiFetch<Tour>("/api/tours/", {
        method: "POST",
        body: data,
    });

export const getToursByDate = (date: string): Promise<Tour[]> =>
    apiFetch<Tour[]>(`/api/tours/?date=${date}`);

export const getTour = (id: number | string): Promise<Tour> =>
    apiFetch<Tour>(`/api/tours/${id}/`);

export const deleteTour = (id: string): Promise<null> =>
    apiFetch<null>(`/api/tours/${id}/`, {
        method: "DELETE",
    });