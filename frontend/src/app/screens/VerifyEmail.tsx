import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { verifyEmail, resendVerificationEmail } from '../../api/auth';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const token = searchParams.get('token');

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [resendCountdown, resendDisabled]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    setMessage('Verifying your email...');
    
    const result = await verifyEmail(verificationToken);
    if (result.ok) {
      setStatus('success');
      setMessage(result.message || 'Email verified successfully!');
      setTimeout(() => navigate('/home'), 3000);
    } else {
      setStatus('error');
      setMessage(result.error || 'Failed to verify email');
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setResendDisabled(true);
    setResendCountdown(60);
    setMessage('Sending verification email...');
    
    const result = await resendVerificationEmail(user.email);
    if (result.ok) {
      setMessage('Verification email sent! Check your inbox.');
    } else {
      setMessage(result.error || 'Failed to resend email');
      setResendDisabled(false);
      setResendCountdown(0);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Promotional Side */}
      <div className="hidden lg:flex w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=2000" 
          alt="Mountain Journey" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="relative z-10 p-12 max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Almost there!</h1>
          <p className="text-xl text-primary-foreground/80 font-medium">Just verify your email to unlock full access to all features.</p>
        </div>
      </div>

      {/* Right Content Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              {status === 'success' ? (
                <div className="text-4xl">✓</div>
              ) : status === 'error' ? (
                <div className="text-4xl">✕</div>
              ) : status === 'verifying' ? (
                <div className="animate-spin text-4xl">⏳</div>
              ) : (
                <div className="text-4xl">✉️</div>
              )}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
              {status === 'success' ? 'Verified!' : status === 'error' ? 'Verification Failed' : 'Verify Your Email'}
            </h2>
            <p className="text-muted-foreground">
              {status === 'success' 
                ? 'Your email has been verified. Redirecting to home...'
                : status === 'error'
                ? 'We couldn\'t verify your email. Please try again.'
                : `We've sent a verification link to ${user.email}`}
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-6">
            {/* Status Messages */}
            {message && (
              <div className={`p-4 rounded-2xl text-sm font-medium ${
                status === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-700'
                  : status === 'error'
                  ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                  : 'bg-primary/10 border border-primary/20 text-primary'
              }`}>
                {message}
              </div>
            )}

            {/* Check Email Section */}
            {status === 'pending' && (
              <div className="space-y-4">
                <div className="bg-secondary/30 p-6 rounded-2xl border border-secondary">
                  <h3 className="font-bold text-foreground mb-3">What to do next:</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the verification link</li>
                    <li>Enjoy full access to TourBooking!</li>
                  </ol>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <p className="text-xs text-yellow-700">
                    <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
                  </p>
                </div>
              </div>
            )}

            {/* Resend Button */}
            {(status === 'pending' || status === 'error') && (
              <button
                onClick={handleResendEmail}
                disabled={resendDisabled}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                  resendDisabled
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Verification Email'}
              </button>
            )}

            {/* Success Action */}
            {status === 'success' && (
              <button
                onClick={() => navigate('/home')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Go to Home
              </button>
            )}

            {/* Additional Help */}
            {status === 'error' && token && (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-full font-bold text-lg transition-all"
              >
                Back to Login
              </button>
            )}
          </div>

          {/* Support Links */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Need help? <a href="#" className="text-primary font-bold hover:underline">Contact support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
