import { useEffect, useState } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, Filter, Star, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTours } from "../../api/tours";

export function Home() {
  const navigate = useNavigate();

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    maxPrice: 500000, // Increased so default tours are not hidden
    maxGroupSize: 100, // Increased so default tours are not hidden
  });

  // ✅ Fetch tours
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
  }, []);

  const categories = ['All', 'Adventure', 'Culture', 'Food', 'Relaxation'];

  // ✅ Only FUTURE tours + filters
  const filteredTours = tours.filter((tour) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const isUpcoming = tour.date >= todayStr;

    const matchesSearch =
      tour.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (tour.category && tour.category === selectedCategory);

    const matchesPrice = !tour.price || tour.price <= filters.maxPrice;

    const matchesGroupSize =
      !tour.max_people || tour.max_people <= filters.maxGroupSize;

    return isUpcoming && matchesSearch && matchesCategory && matchesPrice && matchesGroupSize;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-44 px-8 overflow-hidden bg-primary">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-[120%] bg-primary-foreground/5 -skew-y-3 origin-top-left -z-10 shadow-xl" />
        <div className="absolute top-0 right-0 w-1/2 h-[120%] bg-black/20 skew-y-6 origin-top-right -z-10 mix-blend-multiply opacity-50" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-primary-foreground mb-8 tracking-tighter drop-shadow-sm">
            Discover Your Next <span className="text-accent underline decoration-8 underline-offset-[12px]">Adventure</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/95 max-w-2xl mx-auto mb-12 font-medium drop-shadow-sm">
            Explore curated tours from local experts. From mountain treks to culinary walks, find the perfect experience.
          </p>
          
          {/* Enhanced Search */}
          <div className="bg-card w-full max-w-4xl mx-auto rounded-3xl md:rounded-full p-3 flex flex-col md:flex-row items-center gap-2 shadow-2xl border border-white/10 ring-1 ring-black/5">
            <div className="w-full md:w-auto flex-[1.5] flex items-center gap-3 px-6 py-4 md:py-2">
              <Search className="h-6 w-6 text-primary" />
              <input
                type="text"
                placeholder="Where do you want to go?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-xl text-foreground placeholder:text-muted-foreground font-semibold"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-border/50"></div>
            <div className="w-full md:w-auto flex-1 flex items-center gap-3 px-6 py-4 md:py-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <input
                type="text"
                placeholder="Any dates"
                className="w-full bg-transparent outline-none text-xl text-foreground placeholder:text-muted-foreground font-semibold cursor-not-allowed opacity-50"
                disabled
              />
            </div>
            <button className="w-full md:w-auto bg-accent text-accent-foreground px-10 py-5 rounded-2xl md:rounded-full font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20">
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-8 relative z-20 mt-12">
        
        {/* Header & Categories */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Featured Experiences</h2>
            <p className="text-muted-foreground text-lg mt-1">Handpicked tours starting soon</p>
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm snap-start ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-card text-foreground border border-border hover:border-primary/50'
                }`}
              >
                {category}
              </button>
            ))}
            <button className="px-5 py-3 rounded-full text-sm font-bold border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 transition-all">
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>


        {/* ✅ Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-card rounded-3xl h-96 border border-border"></div>
            ))}
          </div>
        )}

        {/* ❌ Empty state */}
        {!loading && filteredTours.length === 0 && (
          <div className="bg-card border border-border/50 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No tours found</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              We couldn't find any upcoming tours matching your criteria. Try adjusting your search or filters.
            </p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
              className="mt-8 text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* ✅ Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              onClick={() => navigate(`/tour/${tour.id}`)}
              className="bg-card rounded-3xl overflow-hidden border border-border hover:border-primary/40 shadow-sm hover:shadow-xl cursor-pointer group flex flex-col transition-all duration-300"
            >
              {/* Image */}
              <div className="h-64 bg-muted relative overflow-hidden">
                <img
                  src={
                    tour.image
                      ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`)
                      : `https://source.unsplash.com/featured/?${tour.location}`
                  }
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                
                {/* Overlay gradients for better text legibility */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Category Badge */}
                {tour.category && (
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md text-foreground px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase shadow-lg">
                    {tour.category}
                  </div>
                )}
                
                {/* Heart Button */}
                <button className="absolute top-4 right-4 w-10 h-10 bg-background/90 backdrop-blur-md rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow-lg">
                  <Heart size={18} />
                </button>

                {/* Price tag on image */}
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="font-bold text-3xl drop-shadow-md flex items-baseline gap-1">
                    <span className="text-xl">$</span>{tour.price}
                  </div>
                  <div className="text-white/80 text-sm font-medium drop-shadow-sm">per person</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">{tour.title}</h3>
                  <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-md shrink-0">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-bold text-sm">4.8</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                  {tour.description || "Experience the best of " + tour.location + " with a local expert guiding you through hidden gems and popular spots."}
                </p>

                <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-secondary-foreground font-medium">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate">{tour.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-secondary-foreground font-medium">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate">{new Date(tour.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                  </div>
                </div>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}