import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isGuide, setIsGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, is_guide: isGuide }),
      });

      if (res.ok) {
        // auto-login by navigating back to login
        navigate('/');
      } else {
        const txt = await res.text();
        setError(txt || 'Failed to create account');
      }
    } catch (err) {
      setError('Request failed');
    }
  };

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
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Start your journey today.</h1>
          <p className="text-xl text-primary-foreground/80 font-medium">Join our global community of adventurers and passionate tour guides.</p>
        </div>
      </div>

      {/* Right Signup Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Create an account</h2>
            <p className="text-muted-foreground">Sign up to book tours or register as a guide.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-medium text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Username</label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                placeholder="Choose a username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                placeholder="Create a strong password"
              />
            </div>

            <label className="flex items-center gap-3 p-4 bg-secondary/30 rounded-2xl border border-secondary cursor-pointer hover:bg-secondary/50 transition-colors">
              <input 
                type="checkbox" 
                checked={isGuide} 
                onChange={(e) => setIsGuide(e.target.checked)} 
                className="w-5 h-5 rounded border-none bg-background text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold select-none cursor-pointer">Register as a Tour Guide</span>
            </label>

            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-6">
              Create Account
            </button>
            
            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-medium">
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
