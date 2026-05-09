/**
 * Billing page logic.
 */
(function () {
  if (!auth.guard(['admin', 'patient'])) return;

  const user = auth.getUser();
  const isAdmin = user.role === 'admin';
  const content = document.getElementById('page-content');

  let filters = { status: '' };
  let allAppointments = [];
  let allPatients = [];

  content.innerHTML = `
    <div class="space-y-6">
      ${renderPageHeader(
        'Billing and payments',
        'Generate appointment-linked bills, monitor status, and simulate payment completion.',
        `
          <label class="block">
            <span class="field-label">Status</span>
            <select class="field-input" id="bill-filter-status" style="min-width: 10rem;">
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
          ${isAdmin ? '<button type="button" class="btn-primary self-end" id="bill-gen-btn">Generate bill</button>' : ''}
        `
      )}
      <div id="bill-stats" class="grid gap-4 md-grid-3"></div>
      <div id="bill-alert"></div>
      <div id="bill-table"><p class="text-sm text-muted">Loading bills...</p></div>
    </div>
  `;

  document.getElementById('bill-filter-status').addEventListener('change', (e) => {
    filters.status = e.target.value;
    loadBills();
  });

  if (isAdmin) {
    document.getElementById('bill-gen-btn').addEventListener('click', () => openModal('create-bill-modal'));
  }

  loadBills();
  loadMetadata();

  async function loadBills() {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;

      const data = await api.get('/bills', params);
      const bills = data.bills;

      // Stats
      const total = bills.reduce((s, b) => s + Number(b.amount), 0);
      const paid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.amount), 0);
      const unpaid = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + Number(b.amount), 0);

      document.getElementById('bill-stats').innerHTML = [
        renderStatCard('Total billed', formatCurrency(total), 'All bills'),
        renderStatCard('Collected', formatCurrency(paid), 'Paid amounts'),
        renderStatCard('Outstanding', formatCurrency(unpaid), 'Awaiting payment'),
      ].join('');

      document.getElementById('bill-table').innerHTML = renderDataTable(
        [
          { key: 'patient_name', header: 'Patient' },
          { key: 'doctor_name', header: 'Doctor' },
          { key: 'appointment_date', header: 'Appointment', render: r => formatDateTime(r.appointment_date) },
          { key: 'amount', header: 'Amount', render: r => formatCurrency(r.amount) },
          { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
          { key: 'date', header: 'Bill Date', render: r => formatDateTime(r.date) },
        ],
        bills,
        'No bills found.',
        (row) => {
          if (row.status === 'unpaid') {
            return `<button class="btn-secondary" onclick="payBill(${row.id})">Pay now</button>`;
          }
          return '<span class="text-sm font-medium text-muted">Settled</span>';
        }
      );
    } catch (err) {
      showAlert('bill-alert', err.data?.message || 'Unable to load bills.', 'error');
    }
  }

  async function loadMetadata() {
    if (!isAdmin) return;

    try {
      const [patRes, apptRes] = await Promise.all([
        api.get('/patients', { search: '' }),
        api.get('/appointments'),
      ]);

      allPatients = patRes.patients;
      allAppointments = (apptRes.appointments || []).filter(
        a => a.status !== 'cancelled' && !a.bill_id
      );

      // Populate patient dropdown
      document.getElementById('bill-patient-select').innerHTML =
        '<option value="">Select patient</option>' +
        allPatients.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

      // When patient changes, filter appointments
      document.getElementById('bill-patient-select').addEventListener('change', (e) => {
        const patientId = e.target.value;
        const filtered = patientId
          ? allAppointments.filter(a => Number(a.patient_id) === Number(patientId))
          : allAppointments;

        document.getElementById('bill-appt-select').innerHTML =
          '<option value="">Select appointment</option>' +
          filtered.map(a =>
            `<option value="${a.id}">${escapeHtml(a.patient_name)} • ${escapeHtml(a.doctor_name)} • ${formatDateTime(a.date)}</option>`
          ).join('');
      });

      // Automatically calculate amount when appointment is selected
      document.getElementById('bill-appt-select').addEventListener('change', async (e) => {
        const apptId = e.target.value;
        if (!apptId) return;

        try {
          const data = await api.get(`/appointments/${apptId}`);
          let total = 0;
          if (data.prescription && data.prescription.treatment_plan) {
            try {
              const items = JSON.parse(data.prescription.treatment_plan);
              total = items.reduce((sum, item) => sum + item.price, 0);
            } catch (err) {
              console.error('Failed to parse treatment plan:', err);
            }
          }
          
          // Fallback to a base consultation fee if no treatment plan exists
          if (total === 0) total = 500; 

          document.querySelector('input[name="amount"]').value = total;
        } catch (err) {
          console.error('Failed to fetch appointment details for billing:', err);
        }
      });
    } catch (err) {
      showAlert('bill-alert', err.data?.message || 'Unable to load billing metadata.', 'error');
    }
  }

  /* ── Pay bill ── */
  window.payBill = async function (id) {
    try {
      await api.patch(`/bills/${id}/pay`);
      showAlert('bill-alert', 'Payment simulation completed successfully.', 'success');
      loadBills();
      if (isAdmin) loadMetadata();
    } catch (err) {
      showAlert('bill-alert', err.data?.message || 'Unable to simulate payment.', 'error');
    }
  };

  /* ── Create bill form ── */
  document.getElementById('bill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('bill-alert');
    const form = e.target;

    const payload = {
      patient_id: Number(form.patient_id.value),
      appointment_id: Number(form.appointment_id.value),
      amount: Number(form.amount.value),
    };

    try {
      await api.post('/bills', payload);
      showAlert('bill-alert', 'Bill generated successfully.', 'success');
      form.reset();
      closeModal('create-bill-modal');
      loadBills();
      loadMetadata();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('bill-alert', details || err.data?.message || 'Unable to generate bill.', 'error');
    }
  });
})();
