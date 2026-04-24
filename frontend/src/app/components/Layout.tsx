import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      
      {/* Main content area */}
      <div className="flex-1 w-full max-w-7xl mx-auto pt-16 pb-32 md:pb-0 relative">
        <Outlet />
      </div>
      
      {/* Floating Navigation (Mobile Only) */}
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
