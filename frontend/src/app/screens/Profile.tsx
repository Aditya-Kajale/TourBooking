import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import { User, LogOut, Mail, CircleUserRound } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
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
    <div className="min-h-screen bg-background">
      {/* Enhanced Header Area */}
      <div className="bg-primary px-8 pt-20 pb-28 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 text-primary-foreground shadow-2xl ring-4 ring-white/10">
            <CircleUserRound className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground tracking-tight mb-2">{user.username}</h1>
          <div className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">Adventurer</span>
            <span className="text-primary-foreground/60">•</span>
            <span className="text-primary-foreground/80 font-medium">{user.email || 'No email provided'}</span>
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
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-12 py-5 px-6 bg-destructive/5 text-destructive border border-destructive/20 hover:bg-destructive shadow-sm hover:text-white transition-all font-bold text-xl rounded-full flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <LogOut className="h-6 w-6" />
          Terminate Session
        </button>
      </div>
    </div>
  );
}
