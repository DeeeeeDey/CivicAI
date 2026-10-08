import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-12 text-center text-red-500 font-bold text-2xl">403 Forbidden: You don't have access to this portal.</div>;
  }

  return <Outlet />;
};
