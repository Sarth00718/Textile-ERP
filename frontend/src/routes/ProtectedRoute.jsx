import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';

export default function ProtectedRoute({ children, module, action = 'view' }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { can } = usePermission();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (module && !can(module, action)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
