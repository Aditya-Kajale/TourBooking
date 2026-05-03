import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../../api/auth';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
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
      setMessage('');
    } else {
      setStatus('error');
      setMessage(result.error || 'Failed to verify email');
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }
    
    setResendDisabled(true);
    setResendCountdown(60);
    setMessage('Sending verification email...');
    
    const result = await resendVerificationEmail(email);
    if (result.ok) {
      setMessage('Verification email sent! Check your inbox.');
    } else {
      setMessage(result.error || 'Failed to resend email');
      setResendDisabled(false);
      setResendCountdown(0);
    }
  };

  if (status === 'success') {
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
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Welcome!</h1>
            <p className="text-xl text-primary-foreground/80 font-medium">Your email is verified. Now log in to start booking amazing tours.</p>
          </div>
        </div>

        {/* Right Content Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <div className="text-4xl">✓</div>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Email Verified!</h2>
              <p className="text-muted-foreground">Your email has been successfully verified.</p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center">
                <p className="text-green-700 font-bold">✓ {email}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-foreground text-lg">What's next?</h3>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">1.</span>
                    <span>Click the button below to log in</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">2.</span>
                    <span>Use the username and password you created</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">3.</span>
                    <span>Start exploring and booking tours!</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Go to Login
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Already have your credentials?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
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
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Verify Your Email</h1>
            <p className="text-xl text-primary-foreground/80 font-medium">Complete your registration by verifying your email address.</p>
          </div>
        </div>

        {/* Right Content Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="text-4xl">✉️</div>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Verify Your Email</h2>
              <p className="text-muted-foreground">We sent a verification link to your email address.</p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-6">
              {message && (
                <div className={`p-4 rounded-2xl text-sm font-medium ${
                  status === 'error'
                  ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                  : 'bg-primary/10 border border-primary/20 text-primary'
                }`}>
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                  placeholder="your@email.com"
                />
              </div>

              <div className="bg-secondary/30 p-6 rounded-2xl border border-secondary">
                <h3 className="font-bold text-foreground mb-3">What to do:</h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected back here</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <p className="text-xs text-yellow-700">
                  <strong>Tip:</strong> Check your spam/junk folder if you don't see the email.
                </p>
              </div>

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

              <p className="text-center text-sm text-muted-foreground">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary font-bold hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending/Verifying State - Wait for Email Verification
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
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Verify Your Email</h1>
          <p className="text-xl text-primary-foreground/80 font-medium">Complete your registration by verifying your email address.</p>
        </div>
      </div>

      {/* Right Content Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              {status === 'verifying' ? (
                <div className="animate-spin text-4xl">⏳</div>
              ) : status === 'error' ? (
                <div className="text-4xl">✕</div>
              ) : (
                <div className="text-4xl">✉️</div>
              )}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
              {status === 'error' ? 'Verification Failed' : 'Verify Your Email'}
            </h2>
            <p className="text-muted-foreground">
              {status === 'verifying' 
                ? 'Verifying your email...'
                : status === 'error'
                ? 'We couldn\'t verify your email. Please try again.'
                : 'We sent a verification link to your email address.'}
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-6">
            {/* Status Messages */}
            {message && (
              <div className={`p-4 rounded-2xl text-sm font-medium ${
                status === 'error'
                ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                : 'bg-primary/10 border border-primary/20 text-primary'
              }`}>
                {message}
              </div>
            )}

            {/* Email Input for Resend */}
            <div>
              <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                placeholder="your@email.com"
                disabled={status === 'verifying'}
              />
            </div>

            {/* Instructions */}
            <div className="bg-secondary/30 p-6 rounded-2xl border border-secondary">
              <h3 className="font-bold text-foreground mb-3">What to do:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>You'll see the success message here</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
              <p className="text-xs text-yellow-700">
                <strong>💡 Tip:</strong> Check your spam/junk folder if you don't see the email.
              </p>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={resendDisabled || status === 'verifying'}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                (resendDisabled || status === 'verifying')
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Verification Email'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <button 
                onClick={() => navigate('/login')}
                className="text-primary font-bold hover:underline"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
