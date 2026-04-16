import { useEffect, useState } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTours } from "../../api/tours";
import { SeatBadge } from '../components/SeatBadge';

export function Home() {
  const navigate = useNavigate();

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedTours, setBookedTours] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [filters, setFilters] = useState({
    maxPrice: 500000,
    maxGroupSize: 100,
  });

  // ✅ Fetch tours and bookings
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

    // Check localStorage for mocked booked tours
    const localBookings = JSON.parse(localStorage.getItem('booked_tours') || '[]');
    setBookedTours(localBookings.map((t: any) => t.id));

    // Load current user
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  const categories = ['All', 'Adventure', 'Culture', 'Food', 'Relaxation'];

  // ✅ Only FUTURE tours + filters
  const filteredTours = tours.filter((tour) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const isUpcoming = tour.date >= todayStr;

    const matchesSearch =
      !searchQuery ||
      (tour.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (tour.location?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (tour.category && tour.category === selectedCategory);

    const matchesPrice = !tour.price || tour.price <= filters.maxPrice;

    const matchesGroupSize =
      !tour.max_people || tour.max_people <= filters.maxGroupSize;
      
    const matchesDate = !searchDate || (tour.date && tour.date.startsWith(searchDate));

    // Hide tours created by the current user — they are not a customer of their own tours
    const isOwnTour = currentUser && String(tour.created_by) === String(currentUser.id);

    return isUpcoming && !isOwnTour && matchesSearch && matchesCategory && matchesPrice && matchesGroupSize && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background pt-8 pb-24 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-center gap-6 md:gap-8 items-start">
        
        {/* Left Sidebar (Search & Navigation) */}
        <div className="w-full md:w-72 flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
               Discover Tours
            </h2>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search places or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium transition-all"
              />
            </div>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium text-foreground transition-all"
              />
            </div>
            
            {/* Categories Menu */}
            <div className="pt-2 border-t border-border/50">
               <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Categories</h3>
               <div className="flex flex-col gap-1">
                 {categories.map((category) => (
                   <button
                     key={category}
                     onClick={() => setSelectedCategory(category)}
                     className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                       selectedCategory === category
                         ? 'bg-primary/10 text-primary'
                         : 'text-foreground hover:bg-muted/50'
                     }`}
                   >
                     {category}
                   </button>
                 ))}
               </div>
            </div>

            {/* Decorative Nature Image (Requested by user) */}
            <div className="mt-4 rounded-xl overflow-hidden border border-border/50 shadow-sm relative group">
              <img src="/images/nature-sidebar.jpg" onError={(e) => { e.currentTarget.src = 'https://source.unsplash.com/featured/?forest,nature,path'; }} alt="Nature Inspiration" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                <span className="text-white text-xs font-bold leading-tight">Find your path in nature.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Column */}
        <div className="flex-1 max-w-2xl w-full">
          
          {/* Create Post / Upcoming Text Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Upcoming Tours Feed</h1>
          </div>

          {loading && (
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse bg-card rounded-2xl h-80 border border-border"></div>
              ))}
            </div>
          )}

          {!loading && filteredTours.length === 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No tours found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Try adjusting your search keywords, clearing the date, or selecting a different category.
              </p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All'); setSearchDate('');}}
                className="mt-6 text-primary text-sm font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className="space-y-6">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                onClick={() => navigate(`/tour/${tour.id}`)}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow"
              >
                {/* Post Header — Tour Creator Info */}
                <div className="p-4 flex items-center gap-3">
                  {/* Creator avatar: initials of creator's username */}
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-sm text-sm">
                    {(tour.created_by_name || tour.created_by || 'G').toString().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm leading-tight">
                      {tour.created_by_name || `Guide #${String(tour.created_by).slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {new Date(tour.date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})} · {tour.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full text-xs font-bold text-accent shrink-0">
                    <Star className="w-3.5 h-3.5 fill-accent" />
                    <span>4.8</span>
                  </div>
                </div>

                {/* Post Description + Tour Title */}
                <div className="px-4 pb-3">
                  <h3 className="font-bold text-foreground text-base mb-1 leading-snug">{tour.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tour.description || "Join us to explore the beautiful sites around " + tour.location + ". It's going to be an unforgettable adventure!"}
                  </p>
                </div>

                {/* Post Image */}
                <div className="bg-muted relative">
                  <img
                    src={
                      tour.image
                        ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`)
                        : `https://source.unsplash.com/featured/?${tour.location}`
                    }
                    alt={tour.title}
                    className="w-full h-[400px] object-cover"
                  />
                  
                  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-border/50">
                    <div className="font-bold text-lg text-foreground flex items-baseline gap-1">
                      ${tour.price} <span className="text-xs text-muted-foreground font-normal">/ person</span>
                    </div>
                  </div>
                </div>

                {/* Post Footer */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-border/50 bg-card/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{tour.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {bookedTours.includes(tour.id) && (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" /> Booked
                      </div>
                    )}
                    <SeatBadge
                      max_people={tour.max_people}
                      bookings_count={tour.bookings_count}
                      is_housefull={tour.is_housefull}
                    />
                    {tour.category && (
                      <div className="bg-muted px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground">
                        {tour.category}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Sidebar (Trending/Suggested) */}
        <div className="hidden xl:block w-72 sticky top-24">
           <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-1">Trending Locations</h3>
              <p className="text-xs text-muted-foreground mb-4">Popular destinations this month</p>
              <div className="space-y-3">
                {['Bali, Indonesia', 'Kyoto, Japan', 'Swiss Alps', 'Santorini, Greece'].map(dest => (
                  <div key={dest} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                       <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{dest}</div>
                  </div>
                ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}