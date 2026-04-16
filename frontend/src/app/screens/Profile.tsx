import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import { User, LogOut, Mail, CircleUserRound, MapPin, Calendar } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);
  const [bookedTours, setBookedTours] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);

      // Fetch booked tours
      const localBookings = JSON.parse(localStorage.getItem('booked_tours') || '[]');
      setBookedTours(localBookings);
    } catch {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Enhanced Header Area with Nature Background Image */}
      <div className="relative px-8 pt-20 pb-28 shadow-sm overflow-hidden bg-primary">
        {/* Nature Background - fallback to Unsplash forest */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/nature-profile-header.jpg"
            onError={(e) => { e.currentTarget.src = 'https://source.unsplash.com/featured/?mountains,forest,landscape'; }}
            alt="Nature Profile Background"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/10" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center mt-4">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center mb-6 text-white shadow-2xl ring-4 ring-white/5">
            <CircleUserRound className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 drop-shadow-md">{user.username}</h1>
          <div className="flex items-center gap-3">
            <span className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg">Adventurer</span>
            <span className="text-white/60 font-bold">•</span>
            <span className="text-white/90 font-medium text-lg drop-shadow-sm">{user.email || 'No email provided'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-12 relative z-20 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Info Cards */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-6 group hover:border-primary/30 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Account Identity</p>
              <p className="text-2xl font-bold text-foreground">{user.username}</p>
            </div>
          </div>

          {user.email && (
            <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-6 group hover:border-primary/30 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-2xl font-bold text-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* New Placeholder Sections for "Market Ready" look */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm md:col-span-2">
            <h3 className="text-xl font-bold mb-6">Preferences & Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                <span className="font-semibold">Notification Settings</span>
                <span className="text-primary font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                <span className="font-semibold">Language</span>
                <span className="text-primary font-bold">English (US)</span>
              </div>
            </div>
          </div>
          {/* Upcoming Booked Tours Section */}
          <div className="md:col-span-2 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Upcoming Adventures</h2>
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">{bookedTours.length}</span>
            </div>

            {bookedTours.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-inner">
                  <img src="https://source.unsplash.com/100x100/?compass,map" alt="Empty state" className="opacity-50 mix-blend-luminosity" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No upcoming tours yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">Explore our curated destinations and start checking off your bucket list.</p>
                <button onClick={() => navigate('/')} className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-md">Find an Adventure</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookedTours.map((tour, idx) => (
                  <div key={`${tour.id}-${idx}`} onClick={() => navigate(`/tour/${tour.id}`)} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex">
                    <div className="w-1/3 shrink-0 relative overflow-hidden">
                      <img
                        src={tour.image ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`) : `https://source.unsplash.com/featured/?${tour.location}`}
                        alt={tour.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-2 left-2 bg-background/90 text-foreground text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">
                        Paid ✓
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-foreground leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{tour.title}</h4>
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {tour.location}</p>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {new Date(tour.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="md:col-span-2 mt-8 py-5 px-6 bg-destructive/5 text-destructive border border-destructive/20 hover:bg-destructive shadow-sm hover:text-white transition-all font-bold text-xl rounded-full flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <LogOut className="h-6 w-6" />
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
}
