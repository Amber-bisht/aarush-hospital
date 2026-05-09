/**
 * Appointments page logic.
 */
(function () {
  if (!auth.guard(['admin', 'doctor', 'patient'])) return;

  const user = auth.getUser();
  const canBook = user.role !== 'doctor';
  const canPrescribe = user.role === 'doctor' || user.role === 'admin';
  const content = document.getElementById('page-content');

  let filters = { status: '', date: '' };
  let doctorsList = [];
  let patientsList = [];

  content.innerHTML = `
    <div class="space-y-6">
      ${renderPageHeader(
        'Appointment management',
        'Book, reschedule, cancel, and complete appointments with role-aware workflows.',
        `
          <label class="block">
            <span class="field-label">Status</span>
            <select class="field-input" id="appt-filter-status" style="min-width: 10rem;">
              <option value="">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label class="block">
            <span class="field-label">Date</span>
            <input class="field-input" type="date" id="appt-filter-date">
          </label>
          ${canBook ? '<button type="button" class="btn-primary self-end" id="appt-book-btn">Book appointment</button>' : ''}
        `
      )}
      <div id="appt-alert"></div>
      <div id="appt-table"><p class="text-sm text-muted">Loading appointments...</p></div>
    </div>
  `;

  // Filter listeners
  document.getElementById('appt-filter-status').addEventListener('change', (e) => {
    filters.status = e.target.value;
    loadAppointments();
  });
  document.getElementById('appt-filter-date').addEventListener('change', (e) => {
    filters.date = e.target.value;
    loadAppointments();
  });

  if (canBook) {
    document.getElementById('appt-book-btn').addEventListener('click', () => openModal('booking-modal'));
  }

  // Load reference data and appointments
  loadReferenceData();
  loadAppointments();

  async function loadReferenceData() {
    try {
      const [docRes, patRes] = await Promise.all([
        api.get('/doctors', { search: '' }),
        user.role === 'admin' ? api.get('/patients', { search: '' }) : Promise.resolve({ patients: [] }),
      ]);
      doctorsList = docRes.doctors;
      patientsList = patRes.patients || [];

      // Populate doctor dropdown
      const doctorSelect = document.getElementById('booking-doctor-select');
      doctorSelect.innerHTML = '<option value="">Select doctor</option>' +
        doctorsList.map(d => `<option value="${d.id}">${escapeHtml(d.name)} • ${escapeHtml(d.specialization)}</option>`).join('');

      // Populate patient dropdown (admin only)
      const patientField = document.getElementById('booking-patient-field');
      if (user.role === 'admin') {
        patientField.innerHTML = `
          <label class="block">
            <span class="field-label">Patient</span>
            <select class="field-input" name="patient_id" required>
              <option value="">Select patient</option>
              ${patientsList.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </label>
        `;
      }
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to load appointment metadata.', 'error');
    }
  }

  async function loadAppointments() {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;

      const data = await api.get('/appointments', params);
      const appointments = data.appointments;

      document.getElementById('appt-table').innerHTML = renderDataTable(
        [
          { key: 'patient_name', header: 'Patient' },
          { key: 'doctor_name', header: 'Doctor' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
          { key: 'reason', header: 'Reason' },
          { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
        ],
        appointments,
        'No appointments found.',
        (row) => {
          let btns = '';
          if (row.status === 'scheduled') {
            btns += `<button class="btn-secondary" onclick="rescheduleAppt(${row.id}, '${row.date ? row.date.slice(0, 16) : ''}')">Reschedule</button>`;
            btns += ` <button class="btn-danger" onclick="cancelAppt(${row.id})">Cancel</button>`;
          }
          if (canPrescribe && row.status !== 'cancelled') {
            btns += ` <button class="btn-secondary" onclick="openPrescription(${row.id})">Prescription</button>`;
          }
          return btns ? `<div class="flex flex-wrap gap-2">${btns}</div>` : '';
        }
      );
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to load appointments.', 'error');
    }
  }

  /* ── Book appointment ── */
  document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('appt-alert');
    const form = e.target;
    const fd = new FormData(form);

    const payload = {
      patient_id: Number(user.role === 'patient' ? user.profile.id : fd.get('patient_id')),
      doctor_id: Number(fd.get('doctor_id')),
      date: fd.get('date'),
      reason: fd.get('reason'),
      notes: fd.get('notes'),
    };

    try {
      await api.post('/appointments', payload);
      showAlert('appt-alert', 'Appointment booked successfully.', 'success');
      closeModal('booking-modal');
      form.reset();
      loadAppointments();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('appt-alert', details || err.data?.message || 'Unable to book appointment.', 'error');
    }
  });

  /* ── Reschedule ── */
  window.rescheduleAppt = function (id, currentDate) {
    document.getElementById('reschedule-id').value = id;
    document.getElementById('reschedule-form').date.value = currentDate;
    openModal('reschedule-modal');
  };

  document.getElementById('reschedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.appointment_id.value;
    const newDate = new Date(form.date.value).toISOString();

    try {
      await api.patch(`/appointments/${id}/reschedule`, { date: newDate });
      showAlert('appt-alert', 'Appointment rescheduled successfully.', 'success');
      closeModal('reschedule-modal');
      loadAppointments();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('appt-alert', details || err.data?.message || 'Unable to reschedule.', 'error');
    }
  });

  /* ── Cancel ── */
  window.cancelAppt = async function (id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      showAlert('appt-alert', 'Appointment cancelled successfully.', 'success');
      loadAppointments();
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to cancel appointment.', 'error');
    }
  };

  /* ── Prescription ── */
  window.openPrescription = async function (id) {
    try {
      const data = await api.get(`/appointments/${id}`);
      document.getElementById('prescription-appt-id').value = id;
      const form = document.getElementById('prescription-form');
      form.diagnosis.value = data.prescription?.diagnosis || '';
      form.medicines.value = data.prescription?.medicines || '';
      form.notes.value = data.prescription?.notes || '';
      openModal('prescription-modal');
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to open prescription form.', 'error');
    }
  };

  document.getElementById('prescription-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.appointment_id.value;
    const payload = {
      diagnosis: form.diagnosis.value,
      medicines: form.medicines.value,
      notes: form.notes.value,
    };

    try {
      await api.post(`/appointments/${id}/prescription`, payload);
      showAlert('appt-alert', 'Prescription saved successfully.', 'success');
      closeModal('prescription-modal');
      form.reset();
      loadAppointments();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('appt-alert', details || err.data?.message || 'Unable to save prescription.', 'error');
    }
  });
})();
