import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, MapPin, Calendar, BookOpen, LogOut, ShieldCheck, BarChart3 } from 'lucide-react';
import { User } from '../../api/types';

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ users: 0, tours: 0, bookings: 0, pendingGuides: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/admin/login'); return; }
    const parsed = JSON.parse(raw);
    if (!parsed.is_admin) { navigate('/admin/login'); return; }
    setUser(parsed);
    fetchStats(parsed.token);
  }, [navigate]);

  const fetchStats = async (token: string) => {
    try {
      const headers = { 'Authorization': `Token ${token}` };

      const [usersRes, toursRes, bookingsRes, guidesRes] = await Promise.allSettled([
        fetch('http://127.0.0.1:8000/api/admin/guide-applications/?status=pending', { headers }),
        fetch('http://127.0.0.1:8000/api/tours/?page_size=1', { headers }),
        fetch('http://127.0.0.1:8000/api/bookings/', { headers }),
        fetch('http://127.0.0.1:8000/api/admin/guide-applications/', { headers }),
      ]);

      let pendingGuides = 0, totalGuides = 0;
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await usersRes.value.json();
        pendingGuides = Array.isArray(data) ? data.length : (data.results?.length || 0);
      }
      
      let totalTours = 0;
      if (toursRes.status === 'fulfilled' && toursRes.value.ok) {
        const data = await toursRes.value.json();
        totalTours = data.count || 0;
      }
      
      let totalBookings = 0;
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
        const data = await bookingsRes.value.json();
        totalBookings = Array.isArray(data) ? data.length : (data.results?.length || data.count || 0);
      }

      if (guidesRes.status === 'fulfilled' && guidesRes.value.ok) {
        const data = await guidesRes.value.json();
        totalGuides = Array.isArray(data) ? data.length : (data.results?.length || 0);
      }

      setStats({ users: totalGuides, tours: totalTours, bookings: totalBookings, pendingGuides });
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('csrfToken');
    navigate('/admin/login');
  };

  if (!user) return null;

  const statCards = [
    { label: 'Guide Applications', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-900/30' },
    { label: 'Published Tours', value: stats.tours, icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-900/30' },
    { label: 'Total Bookings', value: stats.bookings, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-900/30' },
    { label: 'Pending Reviews', value: stats.pendingGuides, icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-900/30' },
  ];

  const navItems = [
    { label: 'Guide Verification', desc: 'Review and approve guide applications', icon: ShieldCheck, path: '/admin/verification', accent: 'green' },
    { label: 'API Documentation', desc: 'Browse the full OpenAPI / Swagger docs', icon: BookOpen, path: 'http://127.0.0.1:8000/api/docs/', external: true, accent: 'blue' },
    { label: 'Django Admin Panel', desc: 'Raw database management interface', icon: BarChart3, path: 'http://127.0.0.1:8000/secure-admin-panel/', external: true, accent: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-[#060f0b] text-gray-200 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0d1f17]/90 backdrop-blur-md border-b border-green-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-green-400" size={24} />
            <h1 className="text-lg font-bold text-white tracking-wide">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Logged in as <strong className="text-green-400">{user.username}</strong></span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/40 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.first_name || user.username}</h2>
          <p className="text-gray-500">Here's an overview of the TourBooking platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {statCards.map((card) => (
            <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-6 transition-all hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-4">
                <card.icon className={card.color} size={24} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-sm text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <h3 className="text-xl font-semibold text-white mb-6">Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {navItems.map((item) => {
            const content = (
              <div className="bg-[#0d1f17] border border-green-900/30 rounded-2xl p-6 hover:border-green-700/50 transition-all group cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center">
                    <item.icon className="text-green-400" size={20} />
                  </div>
                  <h4 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">{item.label}</h4>
                </div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            );

            if (item.external) {
              return (
                <a key={item.label} href={item.path} target="_blank" rel="noreferrer">
                  {content}
                </a>
              );
            }
            return (
              <Link key={item.label} to={item.path}>
                {content}
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-green-900/20 flex justify-between items-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-green-400 transition-colors">
            ← Exit to main site
          </Link>
          <p className="text-xs text-gray-700">TourBooking Admin v1.0</p>
        </div>
      </main>
    </div>
  );
}
