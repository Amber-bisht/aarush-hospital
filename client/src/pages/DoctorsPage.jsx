import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { doctorService } from '../services/doctorService';
import { formatDateTime } from '../utils/format';

const emptyForm = {
  name: '',
  specialization: '',
  phone: '',
};

const DoctorsPage = () => {
  const { user } = useAuth();
  const isDoctorSelf = user.role === 'doctor';
  const canManage = user.role === 'admin';
  const formModal = useModal(false);
  const detailModal = useModal(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorDetail, setDoctorDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDoctors = async () => {
    if (isDoctorSelf) {
      return;
    }

    setLoading(true);
    try {
      const response = await doctorService.list(search);
      setDoctors(response.doctors);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelfProfile = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getById(user.profile.id);
      setDoctorDetail(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDoctorSelf) {
      loadSelfProfile();
    } else {
      loadDoctors();
    }
  }, [isDoctorSelf]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await doctorService.update(editingId, form);
        setMessage('Doctor updated successfully.');
      } else {
        await doctorService.create(form);
        setMessage('Doctor created successfully.');
      }
      formModal.close();
      setForm(emptyForm);
      setEditingId(null);
      loadDoctors();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to save doctor.');
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    formModal.open();
  };

  const openEdit = (doctor) => {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name,
      specialization: doctor.specialization,
      phone: doctor.phone,
    });
    formModal.open();
  };

  const openDetail = async (doctorId) => {
    try {
      const response = await doctorService.getById(doctorId);
      setDoctorDetail(response);
      detailModal.open();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to open doctor record.');
    }
  };

  const handleDelete = async (doctor) => {
    const confirmed = window.confirm(`Delete doctor profile for ${doctor.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await doctorService.remove(doctor.id);
      setMessage('Doctor deleted successfully.');
      loadDoctors();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete doctor.');
    }
  };

  if (isDoctorSelf) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Doctor profile"
          subtitle="Your current specialization details and assigned appointment workload."
        />
        {error ? (
          <div className="rounded-3xl bg-app-accent/10 px-5 py-4 text-sm font-medium text-app-accent">
            {error}
          </div>
        ) : null}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel p-6">
            <h2 className="section-title">Profile</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Name', doctorDetail?.doctor?.name],
                ['Email', doctorDetail?.doctor?.email],
                ['Phone', doctorDetail?.doctor?.phone],
                ['Specialization', doctorDetail?.doctor?.specialization],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-app-soft px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-app-black">{value || '--'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6">
            <h2 className="section-title">Workload</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {['scheduled', 'completed', 'cancelled'].map((status) => (
                <div key={status} className="rounded-2xl bg-app-soft px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{status}</p>
                  <p className="mt-2 text-3xl font-bold text-app-black">
                    {doctorDetail?.appointments?.filter((item) => item.status === status).length || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'patient_name', header: 'Patient' },
            { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
            { key: 'reason', header: 'Reason' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          ]}
          data={doctorDetail?.appointments || []}
          emptyMessage={loading ? 'Loading appointments...' : 'No assigned appointments yet.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor directory"
        subtitle="Manage doctor profiles or browse clinician specializations across the hospital."
        actions={
          <>
            <input
              className="field-input min-w-60"
              placeholder="Search by doctor or specialization"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={loadDoctors}>
              Search
            </button>
            {canManage ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Add doctor
              </button>
            ) : null}
          </>
        }
      />

      {message ? (
        <div className="rounded-3xl bg-emerald-100 px-5 py-4 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl bg-app-accent/10 px-5 py-4 text-sm font-medium text-app-accent">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={[
          { key: 'name', header: 'Doctor' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'phone', header: 'Phone' },
          { key: 'upcoming_appointments', header: 'Upcoming' },
        ]}
        data={doctors}
        emptyMessage={loading ? 'Loading doctors...' : 'No doctors matched your search.'}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => openDetail(row.id)}>
              View
            </button>
            {canManage ? (
              <>
                <button type="button" className="btn-secondary" onClick={() => openEdit(row)}>
                  Edit
                </button>
                <button type="button" className="btn-danger" onClick={() => handleDelete(row)}>
                  Delete
                </button>
              </>
            ) : null}
          </div>
        )}
      />

      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title={editingId ? 'Edit Doctor' : 'Create Doctor'}
        description="Manage the provider directory and specializations."
      >
        <form className="space-y-5" onSubmit={handleFormSubmit}>
          <FormField label="Doctor name" name="name" value={form.name} onChange={handleInputChange} required />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Specialization"
              name="specialization"
              value={form.specialization}
              onChange={handleInputChange}
              required
            />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleInputChange} required />
          </div>
          <button type="submit" className="btn-primary w-full">
            {editingId ? 'Save changes' : 'Create doctor'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        title={doctorDetail?.doctor?.name || 'Doctor profile'}
        description="Clinician details and, when permitted, appointment workload."
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Email', doctorDetail?.doctor?.email],
              ['Phone', doctorDetail?.doctor?.phone],
              ['Specialization', doctorDetail?.doctor?.specialization],
              ['Created', formatDateTime(doctorDetail?.doctor?.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-app-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{label}</p>
                <p className="mt-2 text-sm font-semibold text-app-black">{value || '--'}</p>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'patient_name', header: 'Patient' },
              { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            ]}
            data={doctorDetail?.appointments || []}
            emptyMessage="No visible appointments for this profile."
          />
        </div>
      </Modal>
    </div>
  );
};

export default DoctorsPage;
