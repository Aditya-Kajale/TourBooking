/**
 * Shared API types — mirrors the DRF serializer fields exactly.
 * Keeping all domain types in one file prevents circular imports
 * and gives every component a single source of truth.
 */

// ─── Tour ────────────────────────────────────────────────────────────────────

export type Tour = {
  id: string;
  title: string;
  location: string;
  description: string;
  date: string;                // "YYYY-MM-DD"
  price: number;
  max_people: number;
  category: string;
  duration: string | null;
  image: string | null;        // relative URL like "/media/tour_images/…"
  created_by: string;          // UUID of the guide
  created_by_name: string | null;
  bookings_count: number;
  is_housefull: boolean;
  available_seats: number;
  created_at: string;          // ISO datetime
  // Optional client-side enrichments
  images?: string[];
  itinerary?: ItineraryStep[];
  rating?: number;
};

export type ItineraryStep = {
  time: string;
  activity: string;
  description: string;
};

// ─── Booking ─────────────────────────────────────────────────────────────────

export type Booking = {
  id: string;
  user: string;
  tour: string;
  participants: number;
  total_price: number;
  date: string;                // "YYYY-MM-DD"
  payment_status: 'unpaid' | 'paid';
  payment_method: string | null;
  paid_at: string | null;      // ISO datetime
  status: string;              // "pending" | "confirmed" | "cancelled"
  created_at: string;          // ISO datetime
  // Nested tour details (read-only from serializer)
  tour_title: string;
  tour_location: string;
  tour_date: string;
  tour_image: string | null;
  tour_price: number;
  tour_category: string;
  participant_details?: {name: string, phone: string}[];
};

export type BookingCreatePayload = {
  tour: string;
  participants: number;
  date: string;
  total_price?: number;
  participant_details?: {name: string, phone: string}[];
  status?: string;
  payment_status?: string;
  payment_method?: string;
};

// ─── User (persisted in localStorage) ────────────────────────────────────────

export type User = {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_pic?: string | null;
  email_verified?: boolean;
  is_guide?: boolean;
  guide_verification_status?: 'not_requested' | 'pending' | 'approved' | 'rejected';
  csrfToken?: string;
  token?: string;
};

// ─── Review ──────────────────────────────────────────────────────────────────

export type Review = {
  id: string;
  user: string;
  tour: string;
  rating: number;
  comment: string;
  created_at: string;
};

// ─── Guide ───────────────────────────────────────────────────────────────────

export type Guide = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
};
