import { apiFetch } from "./client";

export const getTours = () => apiFetch("/api/tours/");

export const createTour = (data: FormData) =>
    apiFetch("/api/tours/", (function() {
        const headers: any = {};
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const user = JSON.parse(raw);
                if (user && user.id) headers['X-DEV-USER'] = user.id;
            }
        } catch (e) {}
        return {
            method: "POST",
            body: data,
            headers,
        };
    })());

export const getToursByDate = (date: string) =>
    apiFetch(`/api/tours/?date=${date}`);

export const getTour = (id: number | string) => apiFetch(`/api/tours/${id}/`);

export const deleteTour = (id: string) => {
    const headers: any = {};
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const user = JSON.parse(raw);
            if (user && user.id) headers['X-DEV-USER'] = user.id;
        }
    } catch (e) {}
    
    return apiFetch(`/api/tours/${id}/`, {
        method: "DELETE",
        headers,
    });
};