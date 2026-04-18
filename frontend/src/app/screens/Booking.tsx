import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Check, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getTour } from '../../api/tours';
import { apiFetch } from '../../api/client';

export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'payment' | 'success'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  
  // Start with passed participants or default to 1
  const initialParticipants = location.state?.participants || 1;
  const [participants, setParticipants] = useState(initialParticipants);
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getTour(id)
      .then((data) => { setTour(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-semibold text-foreground">Tour not found</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold">Back to Home</button>
      </div>
    );
  }

  // Housefull check
  const slotsLeft = Math.max(0, (tour.max_people || 10) - (tour.bookings_count || 0));
  const isHousefull = tour.is_housefull || slotsLeft === 0;

  const subtotal = tour.price * participants;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handlePayment = async () => {
    toast.success('Processing payment...');
    try {
      await apiFetch('/api/bookings/', {
        method: 'POST',
        body: JSON.stringify({
          tour: tour.id,
          participants,
          date: tour.date,
          total_price: total
        })
      });
      
      const bookedTours = JSON.parse(localStorage.getItem('booked_tours') || '[]');
      if (!bookedTours.find((t: any) => t.id === tour.id)) {
        bookedTours.push(tour);
        localStorage.setItem('booked_tours', JSON.stringify(bookedTours));
      }
      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ring-4 ring-primary/5">
            <Check className="h-12 w-12 text-primary" strokeWidth={3} />
          </div>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Your booking for "{tour.title}" has been confirmed. Check your email for details.
          </p>
          
          <div className="bg-card border border-border/40 shadow-[0_2px_20px_rgb(0,0,0,0.04)] rounded-3xl p-6 mb-8 text-left">
            <h3 className="mb-5 text-xl font-semibold">Booking Details</h3>
            <div className="space-y-4 text-base font-medium">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tour</span>
                <span className="text-right flex-1 ml-4 text-foreground">{tour.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{new Date(tour.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participants</span>
                <span className="text-foreground">{participants}</span>
              </div>
              <div className="flex justify-between pt-4 mt-2 border-t border-border/50">
                <span className="font-semibold text-foreground">Total Paid</span>
                <span className="text-lg font-bold text-primary">${total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:opacity-90 transition-opacity font-semibold text-lg shadow-[0_4px_14px_rgba(43,92,67,0.3)]"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-card border border-border/50 text-foreground py-4 rounded-full hover:bg-muted/50 transition-colors font-semibold text-lg"
            >
              View My Adventures
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Housefull screen
  if (isHousefull) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
          <Users className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Housefull!</h1>
        <p className="text-muted-foreground text-lg max-w-sm">
          All spots for <span className="font-semibold text-foreground">"{tour.title}"</span> have been filled. Check out other available tours.
        </p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-opacity shadow-md">
          Browse Other Tours
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto pb-48">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background text-foreground px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-card/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-border/50 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium pl-14">Complete your booking</p>
      </div>

      {/* Tour Summary */}
      <div className="px-5 mt-6 mb-8">
        <div className="bg-card border border-border/40 shadow-[0_2px_20px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden p-4">
          <div className="flex gap-4">
            <img
              src={tour.image ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`) : `https://source.unsplash.com/featured/?${tour.location}`}
              alt={tour.title}
              className="w-28 h-28 rounded-2xl object-cover shadow-sm"
            />
            <div className="flex-1 py-1">
              <h3 className="mb-1.5 font-semibold text-lg leading-tight">{tour.title}</h3>
              <p className="text-sm text-muted-foreground mb-2 font-medium">{tour.location}</p>
              <p className="text-sm text-primary font-medium">
                {new Date(tour.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {slotsLeft} spot{slotsLeft !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Removed local participants selector as it's set on the previous page */}

      {/* Payment Method */}
      <div className="px-5 mb-8">
        <label className="block mb-3 font-semibold text-lg">Payment Method</label>
        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod('upi')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              paymentMethod === 'upi'
                ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20'
                : 'bg-card border-border/50 hover:border-border'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
              paymentMethod === 'upi' ? 'border-primary' : 'border-muted-foreground/50'
            }`}>
              {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">UPI Payment</span>
          </button>

          <button
            onClick={() => setPaymentMethod('card')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              paymentMethod === 'card'
                ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20'
                : 'bg-card border-border/50 hover:border-border'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
              paymentMethod === 'card' ? 'border-primary' : 'border-muted-foreground/50'
            }`}>
              {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">Credit / Debit Card</span>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {paymentMethod === 'upi' ? (
        <div className="px-5 mb-8">
          <label className="block mb-2 text-sm font-semibold text-foreground">UPI ID</label>
          <input
            type="text"
            placeholder="yourname@upi"
            className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
          />
        </div>
      ) : (
        <div className="px-5 mb-8 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-foreground">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] font-medium tracking-wide placeholder:tracking-normal"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-foreground">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] font-medium tracking-wide placeholder:tracking-normal"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-foreground">CVV</label>
              <input
                type="text"
                placeholder="123"
                maxLength={3}
                className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] font-medium tracking-wide placeholder:tracking-normal"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 p-5 z-50 pb-8">
        <div className="max-w-md mx-auto">
          <div className="mb-5 space-y-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>${tour.price} × {participants} {participants === 1 ? 'person' : 'people'}</span>
              <span className="text-foreground">${subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Service Fee</span>
              <span className="text-foreground">${serviceFee}</span>
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t border-border/50">
              <span className="font-semibold text-foreground text-base">Total</span>
              <span className="text-lg font-bold text-primary">${total}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(43,92,67,0.3)] font-semibold text-lg"
          >
            Pay ${total}
          </button>
        </div>
      </div>
    </div>
  );
}
