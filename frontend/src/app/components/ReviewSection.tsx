import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getReviews, createReview, deleteReview, moderateReview, Review } from '../../api/reviews';

interface ReviewSectionProps {
  tourId: string;
  currentUserId?: string | null;
  isStaff?: boolean;
}

export function ReviewSection({ tourId, currentUserId, isStaff }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const fetchReviews = async () => {
    try {
      const data = await getReviews(tourId);
      setReviews(Array.isArray(data) ? data : (data as any).results || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [tourId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Please login to leave a review");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    setSubmitting(true);
    try {
      await createReview(tourId, newRating, newComment);
      toast.success("Review submitted! It will appear after moderation if required.");
      setNewComment('');
      setNewRating(5);
      fetchReviews();
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const handleModerate = async (id: string, isApproved: boolean) => {
    try {
      await moderateReview(id, isApproved);
      toast.success(isApproved ? "Review approved" : "Review hidden");
      fetchReviews();
    } catch (err) {
      toast.error("Moderation failed");
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded-2xl" />;

  return (
    <section className="space-y-12 py-12 border-t border-border/50">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
          Guest Reviews
          <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-bold">
            <Star className="w-4 h-4 fill-accent" />
            {reviews.length > 0 
              ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
              : "No reviews"}
          </div>
        </h2>
      </div>

      {/* Add Review Form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Leave an Experience Review</h3>
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  className={`w-8 h-8 ${star <= newRating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} 
                />
              </button>
            ))}
            <span className="ml-4 font-black text-xl text-accent">{newRating}/5</span>
          </div>
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with other travelers..."
              className="w-full p-6 rounded-2xl border border-border/50 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[120px]"
            />
            <button
              disabled={submitting}
              className="absolute bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? <ShieldCheck className="animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-[2rem]">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Be the first to review this tour!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="group relative bg-card border border-border/50 rounded-3xl p-6 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {review.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{review.username}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/20'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  {(isStaff || currentUserId === review.user) && (
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="p-2 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
              
              {/* Moderation Badge for Staff */}
              {isStaff && (
                <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {review.is_approved ? "Approved" : "Pending Moderation"}
                  </span>
                  <button 
                    onClick={() => handleModerate(review.id, !review.is_approved)}
                    className="text-[10px] font-bold text-primary hover:underline underline-offset-4"
                  >
                    {review.is_approved ? "Hide Review" : "Approve Review"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
