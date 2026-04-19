import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/roleUtils';

const roleOptions = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Admin' },
];

const initialForm = {
  role: 'patient',
  email: '',
  password: '',
  name: '',
  age: '',
  gender: 'female',
  phone: '',
  address: '',
  specialization: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
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

    const payload = {
      ...form,
      age: form.role === 'patient' ? Number(form.age) : undefined,
    };

    try {
      const response = await register(payload);
      navigate(getDefaultRouteForRole(response.user.role), { replace: true });
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-app-accent">
            Create Account
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-app-black">
            Start with a tailored role.
          </h1>
          <p className="mt-4 text-sm leading-7 text-app-muted">
            Patients get self-service visibility, doctors get appointment and prescription
            workflows, and admins get the full command center.
          </p>

          <div className="mt-8 space-y-4">
            {[
              'JWT access and refresh token authentication',
              'Role-based dashboards and protected navigation',
              'Patient, doctor, appointment, billing, and prescription flows',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-app-soft px-4 py-4 text-sm font-medium text-app-black">
                {item}
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-app-muted">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-app-accent">
              Sign in
            </Link>
          </p>
        </section>

        <section className="glass-panel p-8 sm:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Role"
              name="role"
              as="select"
              value={form.role}
              onChange={handleChange}
              options={roleOptions}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@hospital.com"
                required
              />
              <FormField
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 chars"
                required
              />
            </div>

            {(form.role === 'patient' || form.role === 'doctor') && (
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={form.role === 'doctor' ? 'Doctor name' : 'Patient name'}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
                <FormField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  required
                />
              </div>
            )}

            {form.role === 'patient' && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Age"
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    label="Gender"
                    as="select"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={[
                      { value: 'female', label: 'Female' },
                      { value: 'male', label: 'Male' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
                <FormField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city, locality"
                  required
                />
              </>
            )}

            {form.role === 'doctor' && (
              <FormField
                label="Specialization"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Cardiology"
                required
              />
            )}

            {error ? (
              <div className="rounded-2xl bg-app-accent/10 px-4 py-3 text-sm font-medium text-app-accent">
                {error}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
