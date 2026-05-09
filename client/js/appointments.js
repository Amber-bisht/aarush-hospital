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
          ${canBook ? '<button type="button" class="btn-primary self-end" id="appt-book-btn">Book appointment</button>' : ''}
        `
      )}
      <div id="appt-alert"></div>
      <div id="appt-table"><p class="text-sm text-muted">Loading appointments...</p></div>
    </div>
  `;



  if (canBook) {
    document.getElementById('appt-book-btn').addEventListener('click', () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);

      document.getElementById('booking-date').value = dateStr;
      document.getElementById('booking-time').value = timeStr;
      openModal('booking-modal');
    });
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
      const data = await api.get('/appointments');
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
          if (row.status !== 'cancelled') {
            const btnLabel = canPrescribe ? 'Prescription' : 'View Outcome';
            btns += ` <button class="btn-secondary" onclick="openPrescription(${row.id})">${btnLabel}</button>`;
          }
          if (row.bill_id) {
            btns += ` <button class="btn-secondary" onclick="printBill(${row.id})">Print Bill</button>`;
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
      date: new Date(`${fd.get('appt_date')}T${fd.get('appt_time')}`).toISOString(),
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

  /* ── Treatment Logic (Hardcoded) ── */
  const TREATMENT_DATA = {
    services: [
      { id: 's1', name: 'General Consultation', price: 500 },
      { id: 's2', name: 'Follow-up Visit', price: 300 },
      { id: 's3', name: 'Emergency Care', price: 1000 },
      { id: 's4', name: 'Minor Procedure', price: 1500 },
      { id: 's5', name: 'Wound Dressing', price: 250 },
      { id: 's6', name: 'Nursing Care (Daily)', price: 400 },
      { id: 's7', name: 'Physiotherapy', price: 600 },
      { id: 's8', name: 'ICU Day Charge', price: 3500 },
      { id: 's9', name: 'ECG Recording', price: 450 },
      { id: 's10', name: 'Nebulization', price: 200 },
    ],
    medicines: [
      { id: 'm1', name: 'Paracetamol 500mg', price: 25 },
      { id: 'm2', name: 'Amoxicillin 250mg', price: 145 },
      { id: 'm3', name: 'Pantoprazole 40mg', price: 60 },
      { id: 'm4', name: 'Azithromycin 500mg', price: 180 },
      { id: 'm5', name: 'Cetirizine 10mg', price: 30 },
      { id: 'm6', name: 'Metformin 500mg', price: 45 },
      { id: 'm7', name: 'Atorvastatin 10mg', price: 110 },
      { id: 'm8', name: 'Multivitamin Tab', price: 120 },
      { id: 'm9', name: 'Cough Syrup', price: 95 },
      { id: 'm10', name: 'Antacid Liquid', price: 85 },
    ],
    tests: [
      { id: 't1', name: 'CBC (Blood Count)', price: 350 },
      { id: 't2', name: 'Blood Sugar Test', price: 120 },
      { id: 't3', name: 'Lipid Profile', price: 750 },
      { id: 't4', name: 'Liver Function (LFT)', price: 850 },
      { id: 't5', name: 'Kidney Function (KFT)', price: 850 },
      { id: 't6', name: 'Thyroid Profile', price: 600 },
      { id: 't7', name: 'Urine Routine', price: 180 },
      { id: 't8', name: 'Chest X-Ray', price: 550 },
      { id: 't9', name: 'Ultrasound Whole Abdomen', price: 1200 },
      { id: 't10', name: 'Vitamin D Test', price: 1500 },
    ]
  };

  let selectedItems = [];

  function initTreatmentDropdowns() {
    const sSel = document.getElementById('treatment-service-select');
    const mSel = document.getElementById('treatment-medicine-select');
    const tSel = document.getElementById('treatment-test-select');

    sSel.innerHTML = '<option value="">-- Pick Service --</option>' + TREATMENT_DATA.services.map(i => `<option value="${i.id}">${i.name} (₹${i.price})</option>`).join('');
    mSel.innerHTML = '<option value="">-- Pick Medicine --</option>' + TREATMENT_DATA.medicines.map(i => `<option value="${i.id}">${i.name} (₹${i.price})</option>`).join('');
    tSel.innerHTML = '<option value="">-- Pick Test --</option>' + TREATMENT_DATA.tests.map(i => `<option value="${i.id}">${i.name} (₹${i.price})</option>`).join('');

    [sSel, mSel, tSel].forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) return;
        const cat = sel.id.split('-')[1] + 's';
        const item = TREATMENT_DATA[cat].find(i => i.id === id);
        if (item && !selectedItems.find(si => si.id === item.id)) {
          selectedItems.push({ ...item, category: cat });
          renderSelectedItems();
        }
        e.target.value = '';
      });
    });
  }

  function renderSelectedItems() {
    const list = document.getElementById('treatment-items-list');
    const isPatient = auth.getUser().role === 'patient';
    
    if (selectedItems.length === 0) {
      list.innerHTML = '<p class="text-xs text-muted italic">No items added to treatment plan.</p>';
      document.getElementById('treatment-total').textContent = '₹0';
      return;
    }

    let total = 0;
    list.innerHTML = selectedItems.map((item, idx) => {
      total += item.price;
      return `
        <div class="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-2 px-3 shadow-sm">
          <div>
            <span class="text-xs font-bold uppercase text-accent opacity-70">${item.category.slice(0, -1)}</span>
            <p class="text-sm font-semibold text-black">${item.name}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold">₹${item.price}</span>
            ${!isPatient ? `<button type="button" class="text-danger hover:opacity-70" onclick="removeItem(${idx})">✕</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    document.getElementById('treatment-total').textContent = `₹${total}`;
  }

  window.removeItem = function(idx) {
    selectedItems.splice(idx, 1);
    renderSelectedItems();
  };

  /* ── Prescription Modal ── */
  window.openPrescription = async function (id) {
    try {
      const data = await api.get(`/appointments/${id}`);
      document.getElementById('prescription-appt-id').value = id;
      const form = document.getElementById('prescription-form');
      
      form.elements['diagnosis'].value = data.prescription?.diagnosis || '';
      form.elements['medicines'].value = data.prescription?.medicines || '';
      form.elements['notes'].value = data.prescription?.notes || '';
      
      // Parse treatment data from treatment_plan
      try {
        selectedItems = JSON.parse(data.prescription?.treatment_plan || '[]');
      } catch {
        selectedItems = [];
      }

      const isPatient = auth.getUser().role === 'patient';
      
      // Setup UI state
      form.elements['diagnosis'].readOnly = isPatient;
      form.elements['medicines'].readOnly = isPatient;
      form.elements['notes'].readOnly = isPatient;

      // Hide dropdowns for patient
      const selectors = ['treatment-service-select', 'treatment-medicine-select', 'treatment-test-select'];
      selectors.forEach(sid => {
        document.getElementById(sid).parentElement.classList.toggle('hidden', isPatient);
      });
      
      document.getElementById('prescription-save-btn').classList.toggle('hidden', isPatient);
      
      initTreatmentDropdowns();
      renderSelectedItems();
      openModal('prescription-modal');
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to open prescription form.', 'error');
    }
  };

  document.getElementById('prescription-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.elements['appointment_id'].value;
    const payload = {
      diagnosis: form.elements['diagnosis'].value,
      medicines: form.elements['medicines'].value,
      notes: form.elements['notes'].value,
      treatment_plan: JSON.stringify(selectedItems),
    };

    try {
      await api.post(`/appointments/${id}/prescription`, payload);
      showAlert('appt-alert', 'Treatment plan saved successfully.', 'success');
      closeModal('prescription-modal');
      form.reset();
      loadAppointments();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('appt-alert', details || err.data?.message || 'Unable to save treatment plan.', 'error');
    }
  });

  /* ── Print Bill ── */
  window.printBill = async function(id) {
    try {
      const data = await api.get(`/appointments/${id}`);
      const { appointment, prescription, bill } = data;
      
      if (!bill) {
        alert('No bill available for this appointment.');
        return;
      }

      document.getElementById('bill-patient-name').textContent = appointment.patient_name;
      document.getElementById('bill-patient-info').textContent = `Patient ID: #${appointment.patient_id}`;
      document.getElementById('bill-doctor-name').textContent = appointment.doctor_name;
      document.getElementById('bill-doctor-spec').textContent = appointment.specialization;
      document.getElementById('bill-date').textContent = `Date: ${formatDateTime(appointment.date)}`;
      
      const statusBadge = document.getElementById('bill-status-badge');
      statusBadge.innerHTML = renderBadge(bill.status);

      // Parse and render treatment items
      let items = [];
      try {
        items = JSON.parse(prescription?.treatment_plan || '[]');
      } catch {
        items = [];
      }

      const itemsBody = document.getElementById('bill-items-body');
      if (items.length === 0) {
        itemsBody.innerHTML = `
          <tr>
            <td class="py-4 text-slate-500 italic">Consultation & General Services</td>
            <td class="py-4 text-right">₹${bill.amount}</td>
          </tr>
        `;
      } else {
        itemsBody.innerHTML = items.map(item => `
          <tr class="border-b border-slate-50">
            <td class="py-3">
              <span class="text-[10px] font-bold text-muted uppercase block">${item.category}</span>
              ${item.name}
            </td>
            <td class="py-3 text-right">₹${item.price}</td>
          </tr>
        `).join('');
      }

      document.getElementById('bill-total-amount').textContent = `₹${bill.amount}`;
      
      // Update download button listener with correct filename
      const downloadBtn = document.getElementById('download-bill-btn');
      downloadBtn.onclick = () => {
        const element = document.getElementById('bill-content');
        const opt = {
          margin: 0.5,
          filename: `Bill_${appointment.patient_name.replace(/\s+/g, '_')}_${id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
      };

      openModal('bill-modal');
    } catch (err) {
      showAlert('appt-alert', err.data?.message || 'Unable to load bill details.', 'error');
    }
  };
})();
