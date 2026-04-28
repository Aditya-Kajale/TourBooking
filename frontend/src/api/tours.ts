import { apiFetch } from "./client";
import type { Tour } from "./types";

/**
 * All tour-related API calls.
 * Supports server-side search, filtering, ordering, and pagination.
 */

export type ToursResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: Tour[];
};

export type TourQueryParams = {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    date?: string;
    ordering?: string;
    upcoming?: boolean;
    exclude_user?: string;
};

/** Fetch paginated tours with optional filters */
export const getToursPaginated = (params: TourQueryParams = {}): Promise<ToursResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.date) query.set('date', params.date);
    if (params.ordering) query.set('ordering', params.ordering);
    if (params.upcoming) query.set('upcoming', 'true');
    if (params.exclude_user) query.set('exclude_user', params.exclude_user);
    const qs = query.toString();
    return apiFetch<ToursResponse>(`/api/tours/${qs ? `?${qs}` : ''}`);
};

/** Legacy: fetch all tours (no pagination — for backward compatibility) */
export const getTours = async (): Promise<Tour[]> => {
    const res = await apiFetch<Tour[] | ToursResponse>("/api/tours/?page_size=200");
    // Handle both paginated and non-paginated responses
    if (Array.isArray(res)) return res;
    return res.results;
};

export const createTour = (data: FormData): Promise<Tour> =>
    apiFetch<Tour>("/api/tours/", {
        method: "POST",
        body: data,
    });

export const updateTour = (id: string, data: FormData): Promise<Tour> =>
    apiFetch<Tour>(`/api/tours/${id}/`, {
        method: "PATCH",
        body: data,
    });

export const getToursByDate = (date: string): Promise<Tour[]> =>
    getTours().then(tours => tours.filter(t => t.date === date));

export const getTour = (id: number | string): Promise<Tour> =>
    apiFetch<Tour>(`/api/tours/${id}/`);

export const deleteTour = (id: string): Promise<null> =>
    apiFetch<null>(`/api/tours/${id}/`, {
        method: "DELETE",
    });