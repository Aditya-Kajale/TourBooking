import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorVerify } from '../components/TwoFactorVerify';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.status === 202 && data.requires_2fa) {
        // 2FA required
        setRequires2FA(true);
        setSessionCode(data.session_code);
        setUserEmail(data.user.email);
      } else if (res.ok) {
        // Normal login flow
        localStorage.setItem('user', JSON.stringify(data));
        if (data.csrfToken) localStorage.setItem('csrfToken', data.csrfToken);
        if (data.token) localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handle2FASuccess = (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
    if (user.csrfToken) localStorage.setItem('csrfToken', user.csrfToken);
    if (user.token) localStorage.setItem('token', user.token);
    navigate('/home');
  };

  if (requires2FA) {
    return (
      <TwoFactorVerify
        sessionCode={sessionCode}
        userEmail={userEmail}
        onSuccess={handle2FASuccess}
        onCancel={() => {
          setRequires2FA(false);
          setSessionCode('');
          setUserEmail('');
          setPassword('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-hidden flex bg-background">
      {/* Left Promotional Side */}
      <div className="hidden lg:flex w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2000" 
          alt="Adventure" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="relative z-10 p-12 max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Your gateway to the world's best experiences.</h1>
          <p className="text-xl text-primary-foreground/80 font-medium">Join TourBooking to discover, book, or host amazing adventures across the globe.</p>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-xl p-6 max-h-[calc(100vh-3rem)] lg:max-h-none">
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 pb-4 max-h-[calc(100vh-4rem)] lg:max-h-none">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-medium text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Username</label>
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="text-right">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-primary font-semibold hover:underline">
                Forgot password?
              </button>
            </div>

            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4">
              Sign In
            </button>
            
            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-medium">
                Don't have an account?{' '}
                <button type="button" onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">
                  Create one now
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
