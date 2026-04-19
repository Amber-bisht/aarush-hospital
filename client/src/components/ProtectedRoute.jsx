import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/roleUtils';

const ProtectedRoute = ({ allowedRoles }) => {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
