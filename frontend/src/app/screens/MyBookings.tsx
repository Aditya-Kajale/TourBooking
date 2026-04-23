import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, MapPin, Calendar, Users, CreditCard,
  Clock, CheckCircle, AlertCircle, Loader2, Search
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import type { Booking, User } from '../../api/types';

export function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await apiFetch<Booking[]>('/api/bookings/me/', { method: 'GET' });
        setBookings(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load your bookings.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(b =>
    filterStatus === 'all' ? true : b.status === filterStatus
  );

  // Stats
  const totalSpent = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const totalTrips = bookings.length;
  const upcomingTrips = bookings.filter(b => b.date >= new Date().toISOString().split('T')[0]).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'cancelled': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20">
        <AlertCircle className="w-3 h-3" /> Unpaid
      </span>
    );
  };

  const resolveImage = (img: string | null, fallbackLocation: string) => {
    if (!img) return `https://source.unsplash.com/featured/?${fallbackLocation}`;
    return img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 md:px-8 pt-20 pb-28 shadow-sm relative overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground font-semibold mb-6 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">My Bookings</h1>
              <p className="text-primary-foreground/80 text-lg mt-1">Track all your tour reservations and upcoming adventures.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-14 relative z-20 pb-24">

        {/* Stats Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Ticket size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalTrips}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Total Bookings</div>
          </div>

          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent/10 text-accent p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{upcomingTrips}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Upcoming Trips</div>
          </div>

          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">₹{totalSpent.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Total Spent</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Reservations</h2>
          <div className="flex gap-2 bg-secondary p-1 rounded-xl">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  filterStatus === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-secondary-foreground hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading your bookings...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="bg-card border border-border/50 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {filterStatus === 'all'
                ? "You haven't booked any tours yet. Explore our curated collection and start your adventure!"
                : `You don't have any bookings with "${filterStatus}" status. Try a different filter.`
              }
            </p>
            {filterStatus === 'all' ? (
              <button
                onClick={() => navigate('/')}
                className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/30 text-lg"
              >
                Discover Tours
              </button>
            ) : (
              <button
                onClick={() => setFilterStatus('all')}
                className="text-primary font-bold hover:underline"
              >
                Show all bookings
              </button>
            )}
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-5">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => navigate(`/tour/${booking.tour}`)}
                className="bg-card border border-border/50 hover:border-primary/30 rounded-2xl overflow-hidden cursor-pointer group transition-all hover:shadow-lg flex flex-col md:flex-row"
              >
                {/* Tour Image */}
                <div className="w-full md:w-56 h-48 md:h-auto shrink-0 relative overflow-hidden">
                  <img
                    src={resolveImage(booking.tour_image, booking.tour_location)}
                    alt={booking.tour_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-sm ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status}
                    </span>
                  </div>
                  {booking.tour_category && (
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                      {booking.tour_category}
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-bold text-xl text-foreground leading-tight group-hover:text-primary transition-colors">
                        {booking.tour_title}
                      </h3>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-primary">₹{Number(booking.total_price).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground font-medium">total paid</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin size={15} className="text-primary" /> {booking.tour_location}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar size={15} className="text-primary" />
                        {new Date(booking.tour_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users size={15} className="text-primary" /> {booking.participants} {booking.participants === 1 ? 'traveler' : 'travelers'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: payment info + booking meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex items-center gap-3 flex-wrap">
                      {getPaymentBadge(booking.payment_status)}
                      {booking.payment_method && (
                        <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full capitalize">
                          {booking.payment_method}
                        </span>
                      )}
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                        ₹{Number(booking.tour_price)}/person × {booking.participants}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Booked {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
