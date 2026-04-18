import { Home, Calendar, PlusCircle, LayoutDashboard, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    // Only show Add when user is a guide
    ...(user && user.is_guide ? [{ icon: PlusCircle, label: 'Add', path: '/add-tour' }] : []),
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ];

  const renderItem = (item: any) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (location.pathname === '/home' && item.path === '/');
    
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-medium text-sm ${
          isActive
            ? 'text-primary bg-primary/10 shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-transform duration-300 ${
            isActive ? 'scale-105' : 'scale-100'
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="hidden md:block whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo/Brand area */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            TB
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">TourBooking</span>
        </div>

        {/* Navigation Links and Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            {mainNavItems.map(renderItem)}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {renderItem({ icon: User, label: 'Profile', path: '/profile' })}
          </div>
        </div>
      </div>
    </nav>
  );
}
