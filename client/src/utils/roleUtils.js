export const getDefaultRouteForRole = (role) => {
  if (role === 'admin') {
    return '/dashboard';
  }

  return '/appointments';
};

export const getNavigationByRole = (role) => {
  const common = [
    { label: 'Appointments', path: '/appointments' },
    { label: 'Doctors', path: '/doctors' },
  ];

  if (role === 'admin') {
    return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Patients', path: '/patients' },
      { label: 'Doctors', path: '/doctors' },
      { label: 'Appointments', path: '/appointments' },
      { label: 'Billing', path: '/billing' },
    ];
  }

  if (role === 'doctor') {
    return [...common, { label: 'Patients', path: '/patients' }];
  }

  return [...common, { label: 'Patients', path: '/patients' }, { label: 'Billing', path: '/billing' }];
};
