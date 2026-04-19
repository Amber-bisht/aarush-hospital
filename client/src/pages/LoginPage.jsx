import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/roleUtils';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await login(form);
      const fallbackRoute = getDefaultRouteForRole(response.user.role);
      navigate(location.state?.from?.pathname || fallbackRoute, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden bg-app-soft p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex rounded-full bg-app-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-app-accent">
            Hospital Careboard
          </span>
          <h1 className="mt-8 text-6xl font-extrabold leading-[0.95] tracking-tight text-app-black">
            Calm operations for fast-moving care teams.
          </h1>
          <p className="mt-6 text-lg leading-8 text-app-muted">
            Manage patients, doctors, appointments, billing, and prescriptions from one
            modern hospital workspace built for admins, clinicians, and patients.
          </p>
        </div>
        <div className="glass-panel max-w-xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-app-muted">
            Demo Accounts
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-4">
              <p className="font-bold text-app-black">Admin</p>
              <p className="mt-2 text-sm text-app-muted">admin@hospital.com</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="font-bold text-app-black">Doctor</p>
              <p className="mt-2 text-sm text-app-muted">doctor@hospital.com</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="font-bold text-app-black">Patient</p>
              <p className="mt-2 text-sm text-app-muted">patient@hospital.com</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-app-muted">Seed password: Password123!</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="glass-panel w-full max-w-lg p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-app-accent">
            Sign In
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-app-black">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-app-muted">
            Enter your credentials to access the hospital management dashboard.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Email"
              type="email"
              name="email"
              placeholder="you@hospital.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <FormField
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error ? (
              <div className="rounded-2xl bg-app-accent/10 px-4 py-3 text-sm font-medium text-app-accent">
                {error}
              </div>
            ) : null}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-app-muted">
            New here?{' '}
            <Link to="/register" className="font-semibold text-app-accent">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
