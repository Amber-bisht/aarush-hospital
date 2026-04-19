import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { patientService } from '../services/patientService';
import { formatCurrency, formatDateTime } from '../utils/format';

const emptyForm = {
  name: '',
  age: '',
  gender: 'female',
  phone: '',
  address: '',
};

const PatientsPage = () => {
  const { user } = useAuth();
  const isSelfView = user.role === 'patient';
  const canManage = user.role === 'admin';
  const formModal = useModal(false);
  const detailModal = useModal(false);
  const [patients, setPatients] = useState([]);
  const [patientDetail, setPatientDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPatients = async () => {
    if (isSelfView) {
      return;
    }

    setLoading(true);
    try {
      const response = await patientService.list(search);
      setPatients(response.patients);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load patients.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelfRecord = async () => {
    setLoading(true);
    try {
      const response = await patientService.getById(user.profile.id);
      setPatientDetail(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load patient record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSelfView) {
      loadSelfRecord();
    } else {
      loadPatients();
    }
  }, [isSelfView]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        ...form,
        age: Number(form.age),
      };

      if (editingId) {
        await patientService.update(editingId, payload);
        setMessage('Patient updated successfully.');
      } else {
        await patientService.create(payload);
        setMessage('Patient created successfully.');
      }

      formModal.close();
      setForm(emptyForm);
      setEditingId(null);
      loadPatients();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to save patient.');
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    formModal.open();
  };

  const openEdit = (patient) => {
    setEditingId(patient.id);
    setForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
    });
    setError('');
    formModal.open();
  };

  const openDetail = async (patientId) => {
    try {
      const response = await patientService.getById(patientId);
      setPatientDetail(response);
      detailModal.open();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to open patient record.');
    }
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(`Delete patient record for ${patient.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await patientService.remove(patient.id);
      setMessage('Patient deleted successfully.');
      loadPatients();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete patient.');
    }
  };

  if (isSelfView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Care Summary"
          subtitle="A consolidated view of your hospital visits, prescriptions, and billing."
        />
        {error ? (
          <div className="rounded-3xl bg-app-accent/10 px-5 py-4 text-sm font-medium text-app-accent">
            {error}
          </div>
        ) : null}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel p-6">
            <h2 className="section-title">Patient Profile</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Name', patientDetail?.patient?.name],
                ['Age', patientDetail?.patient?.age],
                ['Gender', patientDetail?.patient?.gender],
                ['Phone', patientDetail?.patient?.phone],
                ['Address', patientDetail?.patient?.address],
                ['Email', patientDetail?.patient?.email],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-app-soft px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{label}</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-app-black">{value || '--'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="section-title">Bills Snapshot</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-app-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Total bills</p>
                <p className="mt-2 text-3xl font-bold text-app-black">{patientDetail?.bills?.length || 0}</p>
              </div>
              <div className="rounded-2xl bg-app-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Outstanding</p>
                <p className="mt-2 text-3xl font-bold text-app-black">
                  {formatCurrency(
                    patientDetail?.bills
                      ?.filter((bill) => bill.status === 'unpaid')
                      .reduce((sum, bill) => sum + Number(bill.amount), 0) || 0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'doctor_name', header: 'Doctor' },
            { key: 'specialization', header: 'Specialization' },
            { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          ]}
          data={patientDetail?.appointments || []}
          emptyMessage={loading ? 'Loading appointments...' : 'No appointments found.'}
        />

        <DataTable
          columns={[
            { key: 'doctor_name', header: 'Doctor' },
            { key: 'diagnosis', header: 'Diagnosis' },
            { key: 'medicines', header: 'Medicines' },
            { key: 'created_at', header: 'Issued', render: (row) => formatDateTime(row.created_at) },
          ]}
          data={patientDetail?.prescriptions || []}
          emptyMessage={loading ? 'Loading prescriptions...' : 'No prescriptions found.'}
        />

        <DataTable
          columns={[
            { key: 'appointment_id', header: 'Appointment' },
            { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
          ]}
          data={patientDetail?.bills || []}
          emptyMessage={loading ? 'Loading bills...' : 'No bills found.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient records"
        subtitle="Search, review, and manage patient information with appointment, prescription, and billing context."
        actions={
          <>
            <input
              className="field-input min-w-60"
              placeholder="Search by patient name or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={loadPatients}>
              Search
            </button>
            {canManage ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Add patient
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
          { key: 'name', header: 'Patient' },
          { key: 'age', header: 'Age' },
          { key: 'gender', header: 'Gender' },
          { key: 'phone', header: 'Phone' },
          { key: 'email', header: 'Email' },
        ]}
        data={patients}
        emptyMessage={loading ? 'Loading patients...' : 'No patients matched your search.'}
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
        title={editingId ? 'Edit Patient' : 'Create Patient'}
        description="Capture core demographic details for the patient profile."
      >
        <form className="space-y-5" onSubmit={handleFormSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name" name="name" value={form.name} onChange={handleInputChange} required />
            <FormField
              label="Age"
              type="number"
              name="age"
              value={form.age}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Gender"
              as="select"
              name="gender"
              value={form.gender}
              onChange={handleInputChange}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleInputChange} required />
          </div>
          <FormField
            label="Address"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            required
          />
          <button type="submit" className="btn-primary w-full">
            {editingId ? 'Save changes' : 'Create patient'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        title={patientDetail?.patient?.name || 'Patient record'}
        description="Appointments, prescriptions, and billing tied to this patient."
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Age', patientDetail?.patient?.age],
              ['Gender', patientDetail?.patient?.gender],
              ['Phone', patientDetail?.patient?.phone],
              ['Address', patientDetail?.patient?.address],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-app-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{label}</p>
                <p className="mt-2 text-sm font-semibold capitalize text-app-black">{value}</p>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'doctor_name', header: 'Doctor' },
              { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            ]}
            data={patientDetail?.appointments || []}
            emptyMessage="No appointments found."
          />
          <DataTable
            columns={[
              { key: 'diagnosis', header: 'Diagnosis' },
              { key: 'medicines', header: 'Medicines' },
              { key: 'doctor_name', header: 'Doctor' },
            ]}
            data={patientDetail?.prescriptions || []}
            emptyMessage="No prescriptions found."
          />
        </div>
      </Modal>
    </div>
  );
};

export default PatientsPage;
