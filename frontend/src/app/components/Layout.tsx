import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toaster } from 'sonner';

export function Layout() {
  const location = useLocation();
  
  // Hide bottom nav on certain pages
  const hideBottomNav = location.pathname.startsWith('/tour/') || location.pathname.startsWith('/booking/');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {!hideBottomNav && <BottomNav />}
      <div className="flex-1 w-full max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
