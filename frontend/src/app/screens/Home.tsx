import { useEffect, useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTours } from "../../api/tours";
import { SeatBadge } from '../components/SeatBadge';
import type { Tour, User } from '../../api/types';

export function Home() {
  const navigate = useNavigate();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await getTours();
        setTours(data);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();

    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch { }
  }, []);

  const categories = ['All', 'Adventure', 'Culture', 'Food', 'Relaxation'];

  const filteredTours = tours.filter((tour) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isUpcoming = tour.date >= todayStr;
    const matchesSearch = !searchQuery || (tour.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || (tour.location?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (tour.category && tour.category === selectedCategory);
    const matchesDate = !searchDate || tour.date === searchDate;
    const isOwnTour = currentUser && String(tour.created_by) === String(currentUser.id);
    return isUpcoming && !isOwnTour && matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 overflow-x-hidden">
      <div className="max-w-xl mx-auto px-6 pt-4">
        {/* Header Section - Very Compact */}
        <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Hello, {currentUser?.username?.split(' ')[0] || 'Vanessa'}
            </h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Welcome back</p>
          </div>
          <div 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || 'Vanessa'}`} 
              alt="Profile" 
              className="w-full h-full object-cover bg-primary/10" 
            />
          </div>
        </div>

        {/* Search Bar - Compact */}
        <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-6 duration-500 delay-75">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search destination"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-full border-none bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus:ring-1 focus:ring-primary/20 outline-none text-sm font-medium transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 ${showFilters ? 'bg-primary text-white' : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black'}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Date Filter - Shown only when toggled */}
        {showFilters && (
          <div className="mb-4 animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-card p-3 rounded-2xl border border-border shadow-sm flex items-center gap-3">
              <input 
                type="date" 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-primary"
              />
              {searchDate && (
                <button onClick={() => setSearchDate('')} className="p-1.5 hover:bg-muted rounded-full">
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories - Compact & No Scrollbar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6 animate-in fade-in slide-in-from-top-10 duration-500 delay-150 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black shadow-md'
                  : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tours List - Main Focus */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-lg font-bold">Recommended for you</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:underline">See all</p>
          </div>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-card rounded-[2rem] h-64 border border-border/40"></div>
            ))
          ) : filteredTours.length === 0 ? (
            <div className="bg-card border border-border/40 rounded-[2rem] p-12 text-center shadow-sm">
               <p className="text-muted-foreground font-medium text-sm">No tours found matching your filters.</p>
               {(searchQuery || searchDate || selectedCategory !== 'All') && (
                 <button 
                  onClick={() => {setSearchQuery(''); setSearchDate(''); setSelectedCategory('All');}}
                  className="mt-3 text-xs font-bold text-primary underline"
                 >
                   Reset all filters
                 </button>
               )}
            </div>
          ) : (
            filteredTours.map((tour) => (
              <div
                key={tour.id}
                onClick={() => navigate(`/tour/${tour.id}`)}
                className="bg-card rounded-[2.5rem] border border-border/40 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] cursor-pointer transition-all group"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={tour.image ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`) : `https://source.unsplash.com/featured/?${tour.location}`}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                    <span className="text-xs font-bold">4.8</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                     <div className="bg-background/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-lg">
                        <div className="flex justify-between items-start gap-2">
                           <div className="min-w-0">
                              <h3 className="font-bold text-base truncate mb-1 text-foreground">{tour.title}</h3>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                 <MapPin size={10} className="text-primary" /> {tour.location}
                              </div>
                           </div>
                           <div className="shrink-0 text-right">
                              <div className="font-bold text-primary text-lg tracking-tight">₹{tour.price}</div>
                              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Per Person</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                           <SeatBadge max_people={tour.max_people} bookings_count={tour.bookings_count} is_housefull={tour.is_housefull} />
                           <div className="text-[9px] font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md uppercase tracking-widest">{tour.category}</div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}