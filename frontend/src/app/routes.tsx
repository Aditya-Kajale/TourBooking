import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Index } from './screens/Index';
import { CalendarView } from './screens/CalendarView';
import { AddTour } from './screens/AddTour';
import { TourDetail } from './screens/TourDetail';
import { Dashboard } from './screens/Dashboard';
import { Booking } from './screens/Booking';
import { Profile } from './screens/Profile';
import { MyBookings } from './screens/MyBookings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Index },
      { path: 'home', Component: Home },
      { path: 'login', Component: Login },
      { path: 'signup', Component: Signup },
      { path: 'calendar', Component: CalendarView },
      { path: 'add-tour', Component: AddTour },
      { path: 'tour/:id', Component: TourDetail },
      { path: 'dashboard', Component: Dashboard },
      { path: 'booking/:id', Component: Booking },
      { path: 'my-bookings', Component: MyBookings },
      { path: 'profile', Component: Profile },
    ],
  },
]);
