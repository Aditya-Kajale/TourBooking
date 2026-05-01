import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { register } = useAuth();

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-destructive';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!username.trim()) errors.username = 'Username is required';
    if (username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    if (!email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    if (!password) errors.password = 'Password is required';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) errors.password = 'Password must contain uppercase and lowercase letters';
    if (!/\d/.test(password)) errors.password = 'Password must contain at least one number';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!agreeToTerms) errors.terms = 'You must agree to terms and conditions';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    const res = await register({ 
      username, 
      password, 
      email, 
      first_name: firstName, 
      last_name: lastName, 
      phone, 
      profile_pic: profilePic,
    });

    if (res.ok) {
      // Redirect to email verification page
      navigate('/verify-email');
    } else {
      setError(res.error || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen h-screen overflow-hidden flex bg-background">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-xl p-6 max-h-[calc(100vh-3rem)] lg:max-h-none">
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Create an account</h2>
            <p className="text-muted-foreground">Join our community. Want to share tours? Apply to become a guide after signup.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 pb-4 max-h-[calc(100vh-4rem)] lg:max-h-none">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-medium text-sm">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">First Name *</label>
                <input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.firstName ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Enter your first name"
                />
                {validationErrors.firstName && <p className="text-xs text-destructive mt-1">{validationErrors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Last Name *</label>
                <input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.lastName ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Enter your last name"
                />
                {validationErrors.lastName && <p className="text-xs text-destructive mt-1">{validationErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Username *</label>
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.username ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Choose a username"
                />
                {validationErrors.username && <p className="text-xs text-destructive mt-1">{validationErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Email Address *</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.email ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="you@example.com"
                />
                {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
                <p className="text-xs text-muted-foreground mt-1">We'll send a verification link to this email</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Phone Number *</label>
                <input 
                  type="tel"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.phone ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Enter your phone number"
                />
                {validationErrors.phone && <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>}
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Profile Picture (Optional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePic(e.target.files ? e.target.files[0] : null)} 
                  className="w-full px-5 py-4 bg-card border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium" 
                />
                {profilePic && <p className="text-xs text-muted-foreground mt-1">Selected: {profilePic.name}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.password ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Create a strong password"
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength ? getStrengthColor(passwordStrength) : 'bg-border/30'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {passwordStrength <= 1 ? 'Weak' : passwordStrength <= 2 ? 'Fair' : passwordStrength <= 3 ? 'Good' : 'Strong'} password
                    </p>
                  </div>
                )}
                {validationErrors.password && <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Confirm Password *</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className={`w-full px-5 py-4 bg-card border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium ${validationErrors.confirmPassword ? 'border-destructive' : 'border-border/50'}`} 
                  placeholder="Confirm your password"
                />
                {validationErrors.confirmPassword && <p className="text-xs text-destructive mt-1">{validationErrors.confirmPassword}</p>}
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-secondary/30 rounded-2xl border border-secondary cursor-pointer hover:bg-secondary/50 transition-colors">
              <input 
                type="checkbox" 
                checked={agreeToTerms} 
                onChange={(e) => setAgreeToTerms(e.target.checked)} 
                className="w-5 h-5 rounded border-none bg-background text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-medium select-none cursor-pointer">I agree to the <a href="#" className="text-primary font-bold hover:underline">Terms & Conditions</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a> *</span>
            </label>
            {validationErrors.terms && <p className="text-xs text-destructive">{validationErrors.terms}</p>}

            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-6" type="submit">
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
