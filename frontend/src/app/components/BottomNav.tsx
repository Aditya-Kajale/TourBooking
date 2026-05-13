import { Home, Calendar, PlusCircle, LayoutDashboard, User, Ticket, Shield } from 'lucide-react';
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
    { icon: Ticket, label: 'Bookings', path: '/my-bookings' },
    // Only show Add when user is a guide
    ...(user && user.is_guide ? [{ icon: PlusCircle, label: 'Add', path: '/add-tour' }] : []),
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

  const renderMobileItem = (item: any) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (location.pathname === '/home' && item.path === '/');
    
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={`relative flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive ? 'bg-primary/10 scale-110' : ''}`}>
           <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
        </div>
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
      <div className="bg-card px-3 py-2 rounded-full flex items-center justify-around gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
        {mainNavItems.map(item => renderMobileItem(item))}

        {/* Admin Mobile Item (admin only) */}
        {user && user.is_admin && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="relative flex flex-col items-center justify-center transition-all duration-300 text-amber-500 hover:text-amber-400"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300">
               <Shield className="h-6 w-6" strokeWidth={2} />
            </div>
          </button>
        )}
        
        {/* Profile Mobile Item */}
        <button
          onClick={() => navigate('/profile')}
          className={`relative flex flex-col items-center justify-center transition-all duration-300 ${location.pathname === '/profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${location.pathname === '/profile' ? 'bg-primary/10 scale-110' : ''}`}>
             <User className="h-6 w-6" strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
          </div>
        </button>
      </div>
    </div>
  );
}
