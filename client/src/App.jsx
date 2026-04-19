import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import AppointmentsPage from './pages/AppointmentsPage';
import BillingPage from './pages/BillingPage';
import DashboardPage from './pages/DashboardPage';
import DoctorsPage from './pages/DoctorsPage';
import LoginPage from './pages/LoginPage';
import PatientsPage from './pages/PatientsPage';
import RegisterPage from './pages/RegisterPage';
import { getDefaultRouteForRole } from './utils/roleUtils';

const HomeRedirect = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <Navigate to={user ? getDefaultRouteForRole(user.role) : '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']} />}>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin', 'patient']} />}>
          <Route path="/billing" element={<BillingPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
