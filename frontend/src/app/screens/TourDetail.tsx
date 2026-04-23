import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Star,
  Share2, Heart, MessageCircle, Check, Loader2, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
// ✅ Import the API helper
import { getTour, deleteTour } from "../../api/tours";
import { SeatBadge } from '../components/SeatBadge';
import type { Tour } from '../../api/types';

export function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ State Management
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [participants, setParticipants] = useState(1);

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this tour? This action cannot be undone.")) {
      try {
        await deleteTour(id);
        navigate('/dashboard'); // Go back to dashboard after deletion
      } catch (err) {
        alert("Failed to delete tour. You might not have permission.");
      }
    }
  };


  // ✅ Fetch Tour Data
  useEffect(() => {
    async function fetchTourDetails() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getTour(id);
        setTour(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching tour:", err);
        setError("Could not load tour details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchTourDetails();
  }, [id]);

  // Derived data (Note: In a real app, 'guide' and 'reviews' usually come inside the 'tour' object)
  const guides: any[] = (typeof window !== 'undefined' && (window as any).GUIDES) || [];
  const reviews: any[] = (typeof window !== 'undefined' && (window as any).REVIEWS) || [];

  const guide = tour ? guides.find((g) => g.id === tour.guideId) : null;
  const tourReviews = tour ? reviews.filter((r) => r.tourId === tour.id) : [];
  // detect current user id from localStorage
  let currentUserId: string | null = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) currentUserId = JSON.parse(raw).id;
  } catch { }

  const localBookings = JSON.parse(localStorage.getItem('booked_tours') || '[]');
  const isAlreadyBooked = id ? localBookings.some((t: any) => t.id === id) : false;

  // ✅ Loading View
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading tour details...</p>
      </div>
    );
  }


  // ✅ Error View
  if (error || !tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <MapPin className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Tour not found</h2>
        <p className="text-muted-foreground mb-6">{error || "The tour you are looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hi! I'm interested in the "${tour.title}" tour on ${tour.date}.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* 1. Large Hero / Header Section */}
      <div className="relative h-[550px] w-full overflow-hidden">
        <img
          src={tour.images?.[activeImageIndex] || tour.image}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        {/* Semi-transparent overlay for text readability at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Floating Actions */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white hover:text-primary transition-all font-bold shadow-2xl"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="flex gap-4">
            <button className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all shadow-xl">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-accent transition-all shadow-xl">
              <Heart className="h-5 w-5" />
            </button>
            {tour.created_by === currentUserId && (
              <button
                onClick={handleDelete}
                className="w-12 h-12 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Hero Bottom Info */}
        <div className="absolute bottom-12 left-8 right-8 max-w-7xl mx-auto z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">{tour.category || 'Adventure'}</span>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-bold">{tour.rating || "4.8"}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-tight drop-shadow-2xl">{tour.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-lg font-medium drop-shadow-md">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                    {(tour.created_by_name || 'H').toString().charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-white">Hosted by {tour.created_by_name || "Guide"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  <span>{tour.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main content area: 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-8 pt-12 flex flex-col lg:grid lg:grid-cols-12 gap-16 relative">

        {/* Left Side: Main Details (8 cols) */}
        <div className="lg:col-span-8 space-y-16">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: 'Date', val: new Date(tour.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { icon: Clock, label: 'Duration', val: tour.duration || "Full Day" },
              { icon: Users, label: 'Group Size', val: `Max ${tour.max_people || 10}` },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.val}</p>
              </div>
            ))}
            {/* Seats card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Seats</p>
              <SeatBadge
                max_people={tour.max_people || 10}
                bookings_count={tour.bookings_count || 0}
                is_housefull={tour.is_housefull}
                size="md"
              />
            </div>
          </div>

          {/* Description */}
          <section>
            <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-3">
              About This Experience
              <div className="h-1 flex-1 bg-border/30 rounded-full"></div>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
              {tour.description}
            </p>
          </section>

          {/* Itinerary */}
          {tour.itinerary?.length > 0 && (
            <section>
              <h2 className="text-3xl font-black tracking-tight mb-8">Guided Journey</h2>
              <div className="space-y-0 relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-8 bottom-8 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-full" />

                {tour.itinerary.map((item: any, index: number) => (
                  <div key={index} className="flex gap-8 pb-12 group last:pb-0">
                    <div className="relative z-10 w-12 h-12 bg-card border-4 border-background text-primary font-black rounded-full flex items-center justify-center shrink-0 shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-primary mb-2">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                      <h4 className="text-2xl font-bold mb-3">{item.activity}</h4>
                      <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Guide Preview */}
          <section className="bg-secondary/40 border border-border/50 rounded-[3rem] p-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl ring-4 ring-white/50 pb-2">
                <span className="text-6xl font-bold text-white">{(tour.created_by_name || 'G').toString().charAt(0).toUpperCase()}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg">
                <Check className="w-5 h-5" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-black uppercase tracking-widest text-primary mb-1">Your Host & Guide</p>
              <h3 className="text-3xl font-black mb-3">{tour.created_by_name || `Guide #${String(tour.created_by).slice(0, 6)}`}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-accent text-accent" /> 4.8 Rating</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Local Expert</span>
              </div>
              <p className="text-lg text-foreground font-medium leading-relaxed max-w-2xl">
                {`Passionate local host excited to share the best experiences with you. Let's make some amazing memories!`}
              </p>
            </div>
          </section>
        </div>

        {/* Right Side: Sticky Checkout / Pricing (4 cols) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            <div className="text-center mb-8 border-b border-border/50 pb-8">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Starting From</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl lg:text-5xl font-black tracking-tighter text-primary">₹{tour.price}</span>
                <span className="text-muted-foreground font-bold">/ person</span>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl shadow-sm flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">Group Size</span>
                </div>
                <span className="font-black text-foreground">Up to {tour.max_people || 10}</span>
              </div>
              <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl shadow-sm flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">Availability</span>
                </div>
                <span className="text-green-600 font-black">Live & Open</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isAlreadyBooked && (
                <div className="flex flex-col items-center justify-center gap-1.5 bg-amber-500/10 text-amber-600 p-4 rounded-2xl border border-amber-500/20 shadow-sm text-center">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold">You have already booked this tour</span>
                  </div>
                  <span className="text-sm font-semibold opacity-80 bg-amber-500/10 px-3 py-1 rounded-full mt-1">
                    Booked: {tour.bookings_count || 0}
                  </span>
                </div>
              )}
              {tour.created_by !== currentUserId ? (
                <>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-full font-black text-2xl shadow-xl shadow-primary/30 hover:-translate-y-1 active:scale-[0.98] transition-all"
                  >
                    Check Availability
                  </button>
                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full flex items-center justify-center gap-3 py-4 text-primary font-bold hover:bg-primary/5 rounded-full transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Inquire via WhatsApp
                  </button>
                </>
              ) : (
                <div className="bg-muted/50 p-6 rounded-3xl text-center border-2 border-dashed border-border">
                  <p className="font-bold text-muted-foreground">You are the host of this tour. Manage bookings in your dashboard.</p>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground/60 font-bold mt-8 uppercase tracking-widest">
              Secure checkout • Best price guaranteed
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal (Responsive Slide Up) */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center md:items-end justify-center z-[100]" onClick={() => setShowBookingModal(false)}>
          <div className="bg-background rounded-[3rem] w-full max-w-xl p-10 md:p-12 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-1.5 bg-muted/30 rounded-full mx-auto mb-8" />
            <h2 className="text-4xl font-black tracking-tight mb-4">Make a Reservation</h2>
            <p className="text-muted-foreground font-medium mb-10">Secure your spot for the {tour.title} experience. You won't be charged until the guide confirms.</p>

            <div className="bg-secondary/40 rounded-[2rem] p-8 border border-border/50 mb-10">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50 text-xl">
                <p className="font-bold">Number of Travelers</p>
                <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-full shadow-inner border border-border/50">
                  <button
                    onClick={() => setParticipants(Math.max(1, participants - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary hover:text-white rounded-full font-bold transition-colors"
                  >-</button>
                  <span className="font-black w-4 text-center">{participants}</span>
                  <button
                    onClick={() => setParticipants(participants + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary hover:text-white rounded-full font-bold transition-colors"
                  >+</button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                <p className="font-bold text-lg">Base Price</p>
                <p className="font-black text-2xl text-primary">${(tour.price * participants).toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-bold text-muted-foreground">Service Fee</p>
                <p className="font-bold">${((tour.price * participants) * 0.1).toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-dashed border-border/50">
                <p className="font-black text-2xl">Total Payable</p>
                <p className="font-black text-4xl text-accent">${((tour.price * participants) * 1.1).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-5 rounded-full font-bold text-xl text-muted-foreground hover:bg-muted/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(`/booking/${tour.id}`, { state: { participants } })}
                className="flex-[2] bg-primary text-primary-foreground py-5 rounded-full font-black text-xl shadow-xl shadow-primary/30"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}