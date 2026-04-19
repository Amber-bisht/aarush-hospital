import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { appointmentService } from '../services/appointmentService';
import { billingService } from '../services/billingService';
import { patientService } from '../services/patientService';
import { formatCurrency, formatDateTime } from '../utils/format';

const BillingPage = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const createBillModal = useModal(false);
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    amount: '',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBills = async () => {
    setLoading(true);
    try {
      const response = await billingService.list({
        ...(filters.status ? { status: filters.status } : {}),
      });
      setBills(response.bills);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load bills.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const [patientResponse, appointmentResponse] = await Promise.all([
        patientService.list(''),
        appointmentService.list({}),
      ]);
      setPatients(patientResponse.patients);
      setAppointments(
        appointmentResponse.appointments.filter(
          (appointment) => appointment.status !== 'cancelled' && !appointment.bill_id,
        ),
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load billing metadata.');
    }
  };

  useEffect(() => {
    loadBills();
  }, [filters.status]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) =>
        form.patient_id ? Number(appointment.patient_id) === Number(form.patient_id) : true,
      ),
    [appointments, form.patient_id],
  );

  const totals = useMemo(
    () => ({
      total: bills.reduce((sum, bill) => sum + Number(bill.amount), 0),
      paid: bills
        .filter((bill) => bill.status === 'paid')
        .reduce((sum, bill) => sum + Number(bill.amount), 0),
      unpaid: bills
        .filter((bill) => bill.status === 'unpaid')
        .reduce((sum, bill) => sum + Number(bill.amount), 0),
    }),
    [bills],
  );

  const handleCreateBill = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await billingService.create({
        patient_id: Number(form.patient_id),
        appointment_id: Number(form.appointment_id),
        amount: Number(form.amount),
      });
      setMessage('Bill generated successfully.');
      setForm({ patient_id: '', appointment_id: '', amount: '' });
      createBillModal.close();
      loadBills();
      loadMetadata();
    } catch (requestError) {
      const details = requestError.response?.data?.details?.join(' ');
      setError(details || requestError.response?.data?.message || 'Unable to generate bill.');
    }
  };

  const handlePayBill = async (bill) => {
    try {
      await billingService.pay(bill.id);
      setMessage('Payment simulation completed successfully.');
      loadBills();
      if (isAdmin) {
        loadMetadata();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to simulate payment.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing and payments"
        subtitle="Generate appointment-linked bills, monitor status, and simulate payment completion."
        actions={
          <>
            <FormField
              label="Status"
              as="select"
              className="min-w-40"
              value={filters.status}
              onChange={(event) => setFilters({ status: event.target.value })}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' },
              ]}
            />
            {isAdmin ? (
              <button type="button" className="btn-primary self-end" onClick={createBillModal.open}>
                Generate bill
              </button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(totals.total)} helper="All bills" />
        <StatCard label="Collected" value={formatCurrency(totals.paid)} helper="Paid amounts" />
        <StatCard label="Outstanding" value={formatCurrency(totals.unpaid)} helper="Awaiting payment" />
      </div>

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
          { key: 'appointment_date', header: 'Appointment', render: (row) => formatDateTime(row.appointment_date) },
          { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'date', header: 'Bill Date', render: (row) => formatDateTime(row.date) },
        ]}
        data={bills}
        emptyMessage={loading ? 'Loading bills...' : 'No bills found.'}
        actions={(row) => (
          row.status === 'unpaid' ? (
            <button type="button" className="btn-secondary" onClick={() => handlePayBill(row)}>
              Pay now
            </button>
          ) : (
            <span className="text-sm font-medium text-app-muted">Settled</span>
          )
        )}
      />

      <Modal
        isOpen={createBillModal.isOpen}
        onClose={createBillModal.close}
        title="Generate bill"
        description="Create a new bill tied to an appointment."
      >
        <form className="space-y-5" onSubmit={handleCreateBill}>
          <FormField
            label="Patient"
            as="select"
            name="patient_id"
            value={form.patient_id}
            onChange={(event) => setForm((current) => ({ ...current, patient_id: event.target.value, appointment_id: '' }))}
            options={[
              { value: '', label: 'Select patient' },
              ...patients.map((patient) => ({
                value: patient.id,
                label: patient.name,
              })),
            ]}
            required
          />
          <FormField
            label="Appointment"
            as="select"
            name="appointment_id"
            value={form.appointment_id}
            onChange={(event) => setForm((current) => ({ ...current, appointment_id: event.target.value }))}
            options={[
              { value: '', label: 'Select appointment' },
              ...filteredAppointments.map((appointment) => ({
                value: appointment.id,
                label: `${appointment.patient_name} • ${appointment.doctor_name} • ${formatDateTime(appointment.date)}`,
              })),
            ]}
            required
          />
          <FormField
            label="Amount"
            type="number"
            name="amount"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            placeholder="2500"
            required
          />
          <button type="submit" className="btn-primary w-full">
            Create bill
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
