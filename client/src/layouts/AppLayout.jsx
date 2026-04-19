import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../hooks/useAuth';
import { getNavigationByRole } from '../utils/roleUtils';

const titles = {
  '/dashboard': 'Admin Dashboard',
  '/patients': 'Patients',
  '/doctors': 'Doctors',
  '/appointments': 'Appointments',
  '/billing': 'Billing',
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavigationByRole(user.role);
  const title = titles[location.pathname] || 'Hospital Management System';

  return (
    <div className="min-h-screen bg-app-bg">
      <Sidebar
        navItems={navItems}
        user={user}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <Topbar
            title={title}
            user={user}
            onLogout={logout}
            onMenuClick={() => setMobileOpen(true)}
          />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
