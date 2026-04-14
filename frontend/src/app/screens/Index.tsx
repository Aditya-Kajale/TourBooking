import { Navigate } from 'react-router-dom';

export function Index() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      return <Navigate to="/home" replace />;
    }
  } catch (e) {
    // ignore
  }
  return <Navigate to="/login" replace />;
}
