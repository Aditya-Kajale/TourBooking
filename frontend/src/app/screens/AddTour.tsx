import { useState, useEffect } from 'react';
import {
  MapPin, Calendar, DollarSign, Users, Clock,
  FileText, Image as ImageIcon, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createTour } from "../../api/tours";

export function AddTour() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    price: '',
    max_people: '',
    duration: '',
    category: 'Adventure',
    description: '',
  });

  const categories = ['Adventure', 'Culture', 'Food', 'Relaxation'];

  // ✅ Image handler
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  // ✅ Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // diagnostic info
      try {
        // eslint-disable-next-line no-console
        console.debug('AddTour submit', { user: localStorage.getItem('user'), csrfToken: localStorage.getItem('csrfToken'), hasImage: !!imageFile });
      } catch (e) {}
      const data = new FormData();

      data.append("title", formData.title);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("date", formData.date);
      data.append("price", String(Number(formData.price)));
      data.append("max_people", String(Number(formData.max_people)));
      data.append("category", formData.category);
      data.append("duration", formData.duration);

      if (imageFile) {
        data.append("image", imageFile);
      }

      await createTour(data);

      toast.success("Tour created successfully!");
      setSubmitted(true);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      toast.error("Failed to create tour");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.is_guide) {
      toast.error("Only guides allowed");
      navigate('/');
    }
  }, []);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Check className="h-12 w-12 text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background pb-24">
      {/* Enhanced Header */}
      <div className="bg-primary px-8 pt-16 pb-28 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl font-extrabold text-primary-foreground tracking-tight mb-2">Host an Experience</h1>
          <p className="text-lg text-primary-foreground/80 font-medium max-w-xl">Share your expertise and passion with adventurers from around the world. Fill out the details below to publish your tour.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-16 relative z-20">
        <div className="bg-card p-8 md:p-12 rounded-[2.5rem] border border-border/50 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Form Section Headers */}
            <div className="border-b border-border/50 pb-4 mb-4">
              <h3 className="text-2xl font-bold text-foreground">Basic Details</h3>
              <p className="text-sm text-muted-foreground mt-1">Start with the essential information.</p>
            </div>

            {/* TITLE */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Tour Title</label>
              <input
                placeholder="e.g. Hidden Valleys Trek"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LOCATION */}
              <div className="relative">
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Meeting Point</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <input
                    placeholder="City or Landmark"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                  />
                </div>
              </div>

              {/* DATE */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* DURATION */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Duration</label>
                <input
                  placeholder="e.g. 4 hours"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                />
              </div>

              {/* PRICE */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Price per person ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-primary font-bold"
                />
              </div>

              {/* PEOPLE */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Max Capacity</label>
                <input
                  type="number"
                  placeholder="10"
                  value={formData.max_people}
                  onChange={(e) => setFormData({ ...formData, max_people: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* CATEGORY */}
            <div className="pt-4 border-t border-border/50">
              <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-4">Tour Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c })}
                    className={`py-4 px-2 rounded-2xl border-2 font-bold transition-all ${
                      formData.category === c
                        ? 'bg-primary/10 text-primary border-primary shadow-sm ring-1 ring-primary'
                        : 'bg-background border-transparent hover:bg-secondary/50 text-secondary-foreground border-border/50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="pt-4 border-t border-border/50">
              <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-2">Description</label>
              <textarea
                placeholder="Paint a picture of what your guests will experience. Elaborate on the itinerary and highlights..."
                value={formData.description}
                rows={5}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-5 rounded-[2rem] border border-border/80 bg-background focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none font-medium leading-relaxed"
              />
            </div>

            {/* IMAGE */}
            <div className="pt-4 border-t border-border/50">
              <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-4">Featured Image</label>
              
              {!imagePreview ? (
                <label className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-colors rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer group">
                  <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-lg font-bold text-primary mb-1">Click to upload photo</span>
                  <span className="text-sm text-primary/60 font-medium">JPEG, PNG or WEBP (Max 5MB)</span>
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
              ) : (
                <div className="relative rounded-[2rem] overflow-hidden group border border-border/50 shadow-sm">
                  <img src={imagePreview} className="w-full h-80 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={handleRemoveImage} className="px-6 py-3 bg-white text-destructive font-bold rounded-full hover:scale-105 transition-transform shadow-xl">
                      Remove & Choose Another
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <div className="pt-8 mt-8 border-t border-border/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground p-6 rounded-full font-bold text-2xl shadow-xl hover:shadow-accent/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing Tour..." : "Publish Experience"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}