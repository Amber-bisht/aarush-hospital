import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../services/doctorService';
import { patientService } from '../services/patientService';
import { formatDateTime } from '../utils/format';

const emptyAppointmentForm = {
  patient_id: '',
  doctor_id: '',
  date: '',
  reason: '',
  notes: '',
};

const emptyPrescriptionForm = {
  diagnosis: '',
  medicines: '',
  notes: '',
};

const AppointmentsPage = () => {
  const { user } = useAuth();
  const bookingModal = useModal(false);
  const rescheduleModal = useModal(false);
  const prescriptionModal = useModal(false);
  const canBook = user.role !== 'doctor';
  const canPrescribe = user.role === 'doctor' || user.role === 'admin';
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [appointmentForm, setAppointmentForm] = useState({
    ...emptyAppointmentForm,
    patient_id: user.role === 'patient' ? user.profile.id : '',
  });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescriptionForm);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadReferenceData = async () => {
    try {
      const [doctorResponse, patientResponse] = await Promise.all([
        doctorService.list(''),
        user.role === 'admin' ? patientService.list('') : Promise.resolve({ patients: [] }),
      ]);
      setDoctors(doctorResponse.doctors);
      setPatients(patientResponse.patients || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load appointment metadata.');
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentService.list({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.date ? { date: filters.date } : {}),
      });
      setAppointments(response.appointments);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters.status, filters.date]);

  const handleAppointmentChange = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((current) => ({ ...current, [name]: value }));
  };

  const handlePrescriptionChange = (event) => {
    const { name, value } = event.target;
    setPrescriptionForm((current) => ({ ...current, [name]: value }));
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        ...appointmentForm,
        patient_id: Number(
          user.role === 'patient' ? user.profile.id : appointmentForm.patient_id,
        ),
        doctor_id: Number(appointmentForm.doctor_id),
      };

      await appointmentService.create(payload);
      setMessage('Appointment booked successfully.');
      bookingModal.close();
      setAppointmentForm({
        ...emptyAppointmentForm,
        patient_id: user.role === 'patient' ? user.profile.id : '',
      });
      loadAppointments();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to book appointment.');
    }
  };

  const openReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.date.slice(0, 16));
    rescheduleModal.open();
  };

  const submitReschedule = async (event) => {
    event.preventDefault();
    try {
      await appointmentService.reschedule(selectedAppointment.id, {
        date: new Date(rescheduleDate).toISOString(),
      });
      setMessage('Appointment rescheduled successfully.');
      rescheduleModal.close();
      loadAppointments();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to reschedule.');
    }
  };

  const handleCancel = async (appointment) => {
    const confirmed = window.confirm('Cancel this appointment?');
    if (!confirmed) {
      return;
    }

    try {
      await appointmentService.cancel(appointment.id);
      setMessage('Appointment cancelled successfully.');
      loadAppointments();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel appointment.');
    }
  };

  const openPrescription = async (appointment) => {
    try {
      const response = await appointmentService.getById(appointment.id);
      setSelectedAppointment(appointment);
      setPrescriptionForm({
        diagnosis: response.prescription?.diagnosis || '',
        medicines: response.prescription?.medicines || '',
        notes: response.prescription?.notes || '',
      });
      prescriptionModal.open();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to open prescription form.');
    }
  };

  const submitPrescription = async (event) => {
    event.preventDefault();
    try {
      await appointmentService.savePrescription(selectedAppointment.id, prescriptionForm);
      setMessage('Prescription saved successfully.');
      prescriptionModal.close();
      setPrescriptionForm(emptyPrescriptionForm);
      loadAppointments();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to save prescription.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment management"
        subtitle="Book, reschedule, cancel, and complete appointments with role-aware workflows."
        actions={
          <>
            <FormField
              label="Status"
              as="select"
              className="min-w-40"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <FormField
              label="Date"
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
            />
            {canBook ? (
              <button type="button" className="btn-primary self-end" onClick={bookingModal.open}>
                Book appointment
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
          { key: 'patient_name', header: 'Patient' },
          { key: 'doctor_name', header: 'Doctor' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
          { key: 'reason', header: 'Reason' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        data={appointments}
        emptyMessage={loading ? 'Loading appointments...' : 'No appointments found.'}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            {row.status === 'scheduled' ? (
              <>
                <button type="button" className="btn-secondary" onClick={() => openReschedule(row)}>
                  Reschedule
                </button>
                <button type="button" className="btn-danger" onClick={() => handleCancel(row)}>
                  Cancel
                </button>
              </>
            ) : null}
            {canPrescribe && row.status !== 'cancelled' ? (
              <button type="button" className="btn-secondary" onClick={() => openPrescription(row)}>
                Prescription
              </button>
            ) : null}
          </div>
        )}
      />

      <Modal
        isOpen={bookingModal.isOpen}
        onClose={bookingModal.close}
        title="Book appointment"
        description="Create a new appointment with the right doctor and patient context."
      >
        <form className="space-y-5" onSubmit={handleBookAppointment}>
          {user.role === 'admin' ? (
            <FormField
              label="Patient"
              as="select"
              name="patient_id"
              value={appointmentForm.patient_id}
              onChange={handleAppointmentChange}
              options={[
                { value: '', label: 'Select patient' },
                ...patients.map((patient) => ({
                  value: patient.id,
                  label: patient.name,
                })),
              ]}
              required
            />
          ) : null}
          <FormField
            label="Doctor"
            as="select"
            name="doctor_id"
            value={appointmentForm.doctor_id}
            onChange={handleAppointmentChange}
            options={[
              { value: '', label: 'Select doctor' },
              ...doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.name} • ${doctor.specialization}`,
              })),
            ]}
            required
          />
          <FormField
            label="Appointment date"
            type="datetime-local"
            name="date"
            value={appointmentForm.date}
            onChange={handleAppointmentChange}
            required
          />
          <FormField
            label="Reason"
            name="reason"
            value={appointmentForm.reason}
            onChange={handleAppointmentChange}
            placeholder="Short visit summary"
          />
          <FormField
            label="Notes"
            as="textarea"
            name="notes"
            value={appointmentForm.notes}
            onChange={handleAppointmentChange}
            placeholder="Any preparation or context"
          />
          <button type="submit" className="btn-primary w-full">
            Confirm appointment
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={rescheduleModal.isOpen}
        onClose={rescheduleModal.close}
        title="Reschedule appointment"
        description="Pick a new slot for the selected appointment."
      >
        <form className="space-y-5" onSubmit={submitReschedule}>
          <FormField
            label="New date and time"
            type="datetime-local"
            value={rescheduleDate}
            onChange={(event) => setRescheduleDate(event.target.value)}
            required
          />
          <button type="submit" className="btn-primary w-full">
            Save new slot
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={prescriptionModal.isOpen}
        onClose={prescriptionModal.close}
        title="Prescription and diagnosis"
        description="Record the clinical outcome for this appointment."
      >
        <form className="space-y-5" onSubmit={submitPrescription}>
          <FormField
            label="Diagnosis"
            name="diagnosis"
            value={prescriptionForm.diagnosis}
            onChange={handlePrescriptionChange}
            required
          />
          <FormField
            label="Medicines"
            as="textarea"
            name="medicines"
            value={prescriptionForm.medicines}
            onChange={handlePrescriptionChange}
            required
          />
          <FormField
            label="Clinical notes"
            as="textarea"
            name="notes"
            value={prescriptionForm.notes}
            onChange={handlePrescriptionChange}
          />
          <button type="submit" className="btn-primary w-full">
            Save prescription
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
