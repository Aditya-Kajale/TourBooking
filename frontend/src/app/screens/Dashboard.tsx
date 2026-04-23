import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, MapPin, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTours, deleteTour } from "../../api/tours";
import { apiFetch } from "../../api/client";
import { SeatBadge } from '../components/SeatBadge';
import type { Tour, Booking, User } from '../../api/types';

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'bookings' | 'revenue'>('upcoming');

  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ✅ Read user
  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) setCurrentUser(JSON.parse(u));
    } catch (err) { }
  }, []);

  const fetchData = () => {
    getTours()
      .then(data => {
        setTours(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(err => {
        console.error("Failed to fetch tours:", err);
        setTours([]);
      });

    apiFetch("/api/bookings/")
      .then(data => {
        setBookings(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(err => {
        console.error("Failed to fetch bookings:", err);
        setBookings([]);
      });
  };

  // ✅ Fetch tours and bookings from backend
  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, tourId: string) => {
    e.stopPropagation(); // Prevent navigation to detail page
    if (window.confirm("Are you sure you want to delete this tour? This action cannot be undone.")) {
      try {
        await deleteTour(tourId);
        fetchData(); // Refresh list
      } catch (err) {
        alert("Failed to delete tour. You might not have permission.");
      }
    }
  };


  // ✅ Filter tours
  const todayStr = new Date().toISOString().split('T')[0];

  // Only consider tours created by the logged-in user
  const myCreatedTours = tours.filter((tour) => currentUser && String(tour.created_by) === String(currentUser.id));

  // Filter for upcoming hosted tours
  const myRelevantTours = myCreatedTours.filter((tour) => tour.date >= todayStr);

  const totalRevenue = 0;
  const monthlyRevenue = 0;
  const totalParticipants = 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Area */}
      <div className="bg-primary px-4 md:px-8 pt-20 pb-24 shadow-sm relative overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-start gap-6 md:flex-row md:justify-between md:items-end">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground font-semibold mb-6 transition-colors"
            >
              ← Back
            </button>
            <h1 className="mb-2 text-4xl font-bold text-primary-foreground tracking-tight">Guide Dashboard</h1>
            <p className="text-primary-foreground/80 text-lg">Manage your tours and track performance.</p>
          </div>
          <button
            onClick={() => navigate('/add-tour')}
            className="w-full md:w-auto bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
          >
            + Create New Tour
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 relative z-20 pb-24">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl"><DollarSign size={24} strokeWidth={2.5} /></div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">+12%</span>
            </div>
            <div className="text-3xl font-bold">₹{monthlyRevenue || '2,450'}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Monthly Revenue</div>
          </div>

          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent/10 text-accent p-3 rounded-xl"><Users size={24} strokeWidth={2.5} /></div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">+5%</span>
            </div>
            <div className="text-3xl font-bold">{totalParticipants || '142'}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Total Participants</div>
          </div>

          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/10 text-blue-500 p-3 rounded-xl"><Calendar size={24} strokeWidth={2.5} /></div>
            </div>
            <div className="text-3xl font-bold">{myRelevantTours.length}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Active Tours</div>
          </div>

          <div className="bg-card shadow-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 text-purple-500 p-3 rounded-xl"><TrendingUp size={24} strokeWidth={2.5} /></div>
            </div>
            <div className="text-3xl font-bold">₹{totalRevenue || '12,800'}</div>
            <div className="text-sm text-muted-foreground mt-1 font-medium">Total Earnings Pipeline</div>
          </div>
        </div>

        {/* Workspace Area */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Your Schedule</h2>

              {/* Tabs */}
              <div className="flex gap-2 bg-secondary p-1 rounded-xl">
                {['upcoming', 'bookings', 'revenue'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-secondary-foreground hover:text-primary'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {myRelevantTours.length === 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-12 text-center text-muted-foreground">
                    No upcoming tours found. Create one to get started!
                  </div>
                ) : (
                  myRelevantTours.map((tour) => {
                    const isCreated = true; // All mapped tours are now hosted tours by definition
                    return (
                      <div
                        key={tour.id}
                        onClick={() => navigate(`/tour/${tour.id}`)}
                        className="bg-card border border-border/50 hover:border-primary/30 p-5 rounded-2xl cursor-pointer relative group transition-all hover:shadow-md flex gap-6"
                      >
                        <div className="w-40 h-32 shrink-0 rounded-xl overflow-hidden relative">
                          <img
                            src={
                              tour.image
                                ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`)
                                : `https://source.unsplash.com/featured/?${tour.location}`
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={tour.title}
                          />
                          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded backdrop-blur-sm">
                            Host
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-xl text-foreground truncate pr-4">{tour.title}</h3>
                            <div className="font-bold text-lg text-primary">₹{tour.price}</div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5 font-medium"><MapPin size={16} className="text-secondary-foreground" /> {tour.location}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1.5 font-medium"><Calendar size={16} className="text-secondary-foreground" /> {new Date(tour.date).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                                <Clock size={14} /> {tour.duration || "Full Day"}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                                <Users size={14} /> Max {tour.max_people}
                              </span>
                              <SeatBadge
                                max_people={tour.max_people}
                                bookings_count={tour.bookings_count}
                                is_housefull={tour.is_housefull}
                              />
                            </div>

                            {isCreated && (
                              <button
                                onClick={(e) => handleDelete(e, tour.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                title="Delete Tour"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p>Booking management features coming soon.</p>
              </div>
            )}

            {activeTab === 'revenue' && (
              <div className="bg-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p>Detailed revenue analytics coming soon.</p>
              </div>
            )}

          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors">
                  Edit Profile
                </button>
                <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors">
                  Manage Payouts
                </button>
                <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors">
                  View Public Page
                </button>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2 text-primary">Pro Tip</h3>
              <p className="text-sm text-secondary-foreground leading-relaxed">
                Tours with high-quality images and clear itineraries receive 40% more bookings. Update your upcoming tours with vivid descriptions.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}