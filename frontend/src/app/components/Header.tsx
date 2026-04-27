import { User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Home, Calendar, PlusCircle, LayoutDashboard, Ticket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Ticket, label: 'Bookings', path: '/my-bookings' },
    ...(user.is_guide ? [{ icon: PlusCircle, label: 'Add', path: '/add-tour' }] : []),
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ];

  const renderDesktopItem = (item: any) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (location.pathname === '/home' && item.path === '/');
    
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
    <nav className="fixed top-0 left-0 right-0 z-[60] bg-background border-b border-border shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo/Brand area */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            TB
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">TourBooking</span>
        </div>

        {/* Navigation Links and Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Main Nav */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {mainNavItems.map(item => renderDesktopItem(item))}
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* Desktop Profile Button */}
            <button
              onClick={() => navigate('/profile')}
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
          </div>
        </div>
      </div>
    </nav>
  );
}
