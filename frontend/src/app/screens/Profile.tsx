import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, Shield, LogOut, CircleUserRound, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorManagement } from '../components/TwoFactorManagement';
import { apiFetch } from '../../api/client';
import { Booking } from '../../api/types';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiFetch<Booking[]>('/api/bookings/');
        setBookings(data);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const displayName = fullName || user?.username || 'Adventurer';
  const profilePicUrl = user?.profile_pic || '';

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
        <p className="text-muted-foreground mb-6">Please sign in to view your profile and adventures.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Enhanced Header Area with Nature Background Image */}
      <div className="relative px-4 md:px-8 pt-24 md:pt-20 pb-28 shadow-sm overflow-hidden bg-primary">
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
          <div className="w-32 h-32 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full overflow-hidden mb-6 text-white shadow-2xl ring-4 ring-white/5">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt={`${displayName} profile picture`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-white">
                <CircleUserRound className="w-16 h-16" />
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 drop-shadow-md">{displayName}</h1>
          <div className="flex items-center gap-3">
            <span className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg">Adventurer</span>
            <span className="text-white/60 font-bold">•</span>
            <span className="text-white/90 font-medium text-lg drop-shadow-sm">{user.email || 'No email provided'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-8 md:-mt-12 relative z-20 pb-24">
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

          {fullName && (
            <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-6 group hover:border-primary/30 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-2xl font-bold text-foreground">{fullName}</p>
              </div>
            </div>
          )}

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

          {user.phone && (
            <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-6 group hover:border-primary/30 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Phone Number</p>
                <p className="text-2xl font-bold text-foreground">{user.phone}</p>
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

          {/* Two-Factor Authentication Management */}
          <TwoFactorManagement />
          {/* Quick Link to My Bookings */}
          <div className="md:col-span-2 mt-6">
            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full bg-card border border-border/50 rounded-3xl p-8 shadow-sm hover:border-primary/30 transition-all group flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">My Bookings</h3>
                  <p className="text-sm text-muted-foreground font-medium">View all your tour reservations and upcoming adventures</p>
                </div>
              </div>
              <span className="text-primary font-bold text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="md:col-span-2 mt-8 py-5 px-6 bg-destructive/5 text-destructive border border-destructive/20 hover:bg-destructive shadow-sm hover:text-white transition-all font-bold text-xl rounded-full flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <LogOut className="h-6 w-6" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
