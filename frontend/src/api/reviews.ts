import { apiFetch } from "./client";

export interface Review {
    id: string;
    user: string;
    username: string;
    tour: string;
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
}

export const getReviews = (tourId: string): Promise<Review[]> =>
    apiFetch<Review[]>(`/api/reviews/?tour=${tourId}`);

export const createReview = (tourId: string, rating: number, comment: string): Promise<Review> =>
    apiFetch<Review>("/api/reviews/", {
        method: "POST",
        body: JSON.stringify({ tour: tourId, rating, comment }),
    });

export const deleteReview = (id: string): Promise<null> =>
    apiFetch<null>(`/api/reviews/${id}/`, {
        method: "DELETE",
    });

export const moderateReview = (id: string, is_approved: boolean): Promise<any> =>
    apiFetch<any>(`/api/reviews/${id}/moderate/`, {
        method: "POST",
        body: JSON.stringify({ is_approved }),
    });
