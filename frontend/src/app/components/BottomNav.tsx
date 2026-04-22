import { Home, Calendar, PlusCircle, LayoutDashboard, User, Ticket, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!raw) return null; // hide nav when not logged in

  let user: any = null;
  try { user = JSON.parse(raw); } catch { user = null; }

  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Ticket, label: 'Bookings', path: '/my-bookings' },
    // Only show Add when user is a guide
    ...(user && user.is_guide ? [{ icon: PlusCircle, label: 'Add', path: '/add-tour' }] : []),
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  typeof window !== 'undefined' && window.addEventListener('popstate', () => setIsMobileMenuOpen(false));

  const renderItem = (item: any, isMobile: boolean = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (location.pathname === '/home' && item.path === '/');
    
    if (isMobile) {
      return (
        <button
          key={item.path}
          onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 font-semibold w-full text-left ${
            isActive
              ? 'text-primary bg-primary/10'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-lg">{item.label}</span>
        </button>
      );
    }

    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-medium text-sm ${
          isActive
            ? 'text-primary bg-primary/10 shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="hidden lg:block whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo/Brand area */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              TB
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">TourBooking</span>
          </div>

          {/* Navigation Links and Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Main Nav */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              {mainNavItems.map(item => renderItem(item, false))}
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              {/* Profile Button (Always visible but icon only on mobile) */}
              <button
                onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                className={`hidden md:flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full transition-all duration-300 font-medium text-sm ${
                  location.pathname === '/profile'
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                <User
                  className={`h-5 w-5 transition-transform duration-300 ${
                    location.pathname === '/profile' ? 'scale-110' : 'scale-100'
                  }`}
                  strokeWidth={location.pathname === '/profile' ? 2.5 : 2}
                />
                <span className="hidden md:block whitespace-nowrap">Profile</span>
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              <button 
                className="md:hidden p-2 -mr-2 text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border shadow-xl p-4 flex flex-col gap-2 z-[99]">
            {mainNavItems.map(item => renderItem(item, true))}
            <div className="h-px bg-border my-2 w-full" />
            <button
              onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 font-semibold w-full text-left ${
                location.pathname === '/profile'
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <User className="h-5 w-5" strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
              <span className="text-lg">Profile</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
