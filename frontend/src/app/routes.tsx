import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { VerifyEmail } from './screens/VerifyEmail';
import { Index } from './screens/Index';
import { CalendarView } from './screens/CalendarView';
import { AddTour } from './screens/AddTour';
import { TourDetail } from './screens/TourDetail';
import { Dashboard } from './screens/Dashboard';
import { Booking } from './screens/Booking';
import { Profile } from './screens/Profile';
import { MyBookings } from './screens/MyBookings';
import { ForgotPassword } from './screens/ForgotPassword';
import { ResetPassword } from './screens/ResetPassword';
import AdminVerificationDashboard from './screens/AdminVerificationDashboard';
import { AdminLogin } from './screens/AdminLogin';
import { AdminDashboard } from './screens/AdminDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Index },
      { path: 'home', Component: Home },
      { path: 'calendar', Component: CalendarView },
      { path: 'add-tour', Component: AddTour },
      { path: 'edit-tour/:id', Component: AddTour },
      { path: 'tour/:id', Component: TourDetail },
      { path: 'dashboard', Component: Dashboard },
      { path: 'booking/:id', Component: Booking },
      { path: 'my-bookings', Component: MyBookings },
      { path: 'profile', Component: Profile },
    ],
  },
  { path: 'login', Component: Login },
  { path: 'signup', Component: Signup },
  { path: 'verify-email', Component: VerifyEmail },
  { path: 'forgot-password', Component: ForgotPassword },
  { path: 'reset-password', Component: ResetPassword },
  { path: 'admin/login', Component: AdminLogin },
  { path: 'admin/dashboard', Component: AdminDashboard },
  { path: 'admin/verification', Component: AdminVerificationDashboard },
]);
