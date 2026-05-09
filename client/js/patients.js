/**
 * Patients page logic.
 */
(function () {
  if (!auth.guard(['admin', 'doctor', 'patient'])) return;

  const user = auth.getUser();
  const isSelfView = user.role === 'patient';
  const canManage = user.role === 'admin';
  const content = document.getElementById('page-content');
  let searchQuery = '';

  if (isSelfView) {
    if (!user.profile) {
      content.innerHTML = `<div class="alert alert-error">Profile not found. Please contact support.</div>`;
      return;
    }
    renderSelfRecord();
  } else {
    renderPatientDirectory();
  }

  /* ── Patient Self View ── */
  async function renderSelfRecord() {
    content.innerHTML = `
      <div class="space-y-6">
        ${renderPageHeader('My Care Summary', 'A consolidated view of your hospital visits, prescriptions, and billing.')}
        <div id="pat-alert"></div>
        <div id="pat-self-body"><p class="text-sm text-muted">Loading your records...</p></div>
      </div>
    `;

    try {
      const data = await api.get(`/patients/${user.profile.id}`);
      const patient = data.patient;
      const appointments = data.appointments || [];
      const prescriptions = data.prescriptions || [];
      const bills = data.bills || [];

      const outstanding = bills
        .filter(b => b.status === 'unpaid')
        .reduce((sum, b) => sum + Number(b.amount), 0);

      document.getElementById('pat-self-body').innerHTML = `
        <div class="grid gap-6 xl-grid-0-95-1-05">
          <div class="glass-panel" style="padding: 1.5rem;">
            <h2 class="section-title">Patient Profile</h2>
            <div class="mt-6 grid gap-4 sm-grid-2">
              ${renderInfoBox('Name', patient?.name)}
              ${renderInfoBox('Age', patient?.age)}
              ${renderInfoBox('Gender', patient?.gender)}
              ${renderInfoBox('Phone', patient?.phone)}
              ${renderInfoBox('Address', patient?.address)}
              ${renderInfoBox('Email', patient?.email)}
            </div>
          </div>
          <div class="glass-panel" style="padding: 1.5rem;">
            <h2 class="section-title">Bills Snapshot</h2>
            <div class="mt-6 grid gap-4 sm-grid-2">
              ${renderInfoBox('Total bills', bills.length, true)}
              ${renderInfoBox('Outstanding', formatCurrency(outstanding), true)}
            </div>
          </div>
        </div>

        ${renderDataTable(
          [
            { key: 'doctor_name', header: 'Doctor' },
            { key: 'specialization', header: 'Specialization' },
            { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
            { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
          ],
          appointments,
          'No appointments found.'
        )}

        ${renderDataTable(
          [
            { key: 'doctor_name', header: 'Doctor' },
            { key: 'diagnosis', header: 'Diagnosis' },
            { key: 'medicines', header: 'Medicines' },
            { key: 'created_at', header: 'Issued', render: r => formatDateTime(r.created_at) },
          ],
          prescriptions,
          'No prescriptions found.'
        )}

        ${renderDataTable(
          [
            { key: 'appointment_id', header: 'Appointment' },
            { key: 'amount', header: 'Amount', render: r => formatCurrency(r.amount) },
            { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
            { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
          ],
          bills,
          'No bills found.'
        )}
      `;
    } catch (err) {
      showAlert('pat-alert', err.data?.message || 'Unable to load patient record.', 'error');
    }
  }

  /* ── Patient Directory (Admin / Doctor view) ── */


  async function renderPatientDirectory() {
    content.innerHTML = `
      <div class="space-y-6">
        ${renderPageHeader(
          'Patient records',
          'Search, review, and manage patient information with appointment, prescription, and billing context.',
          `
            ${canManage ? '<button type="button" class="btn-primary" id="pat-add-btn">Add patient</button>' : ''}
          `
        )}
        <div id="pat-alert"></div>
        <div id="pat-table"><p class="text-sm text-muted">Loading patients...</p></div>
      </div>
    `;

    if (canManage) {
      document.getElementById('pat-add-btn').addEventListener('click', openCreatePatient);
    }

    loadPatients();
  }

  async function loadPatients() {
    try {
      const data = await api.get('/patients', { search: searchQuery });
      const patients = data.patients;

      document.getElementById('pat-table').innerHTML = renderDataTable(
        [
          { key: 'name', header: 'Patient' },
          { key: 'age', header: 'Age' },
          { key: 'gender', header: 'Gender' },
          { key: 'phone', header: 'Phone' },
          { key: 'email', header: 'Email' },
        ],
        patients,
        'No patients matched your search.',
        (row) => {
          let btns = `<button class="btn-secondary" onclick="viewPatient(${row.id})">View</button>`;
          if (canManage) {
            btns += ` <button class="btn-secondary" onclick="editPatient(${row.id}, '${escapeHtml(row.name)}', ${row.age}, '${escapeHtml(row.gender)}', '${escapeHtml(row.phone)}', '${escapeHtml(row.address || '')}')">Edit</button>`;
            btns += ` <button class="btn-danger" onclick="deletePatient(${row.id}, '${escapeHtml(row.name)}')">Delete</button>`;
          }
          return `<div class="flex flex-wrap gap-2">${btns}</div>`;
        }
      );
    } catch (err) {
      console.error('Failed to load patients:', err);
      showAlert('pat-alert', err.data?.message || err.message || 'Unable to load patients.', 'error');
    }
  }

  /* ── CRUD handlers ── */
  window.viewPatient = async function (id) {
    try {
      const data = await api.get(`/patients/${id}`);
      document.getElementById('patient-detail-title').textContent = data.patient?.name || 'Patient record';
      document.getElementById('patient-detail-body').innerHTML = `
        <div class="grid gap-4 sm-grid-2">
          ${renderInfoBox('Age', data.patient?.age)}
          ${renderInfoBox('Gender', data.patient?.gender)}
          ${renderInfoBox('Phone', data.patient?.phone)}
          ${renderInfoBox('Address', data.patient?.address)}
        </div>
        ${renderDataTable(
          [
            { key: 'doctor_name', header: 'Doctor' },
            { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
            { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
          ],
          data.appointments || [],
          'No appointments found.'
        )}
        ${renderDataTable(
          [
            { key: 'diagnosis', header: 'Diagnosis' },
            { key: 'medicines', header: 'Medicines' },
            { key: 'doctor_name', header: 'Doctor' },
          ],
          data.prescriptions || [],
          'No prescriptions found.'
        )}
      `;
      openModal('patient-detail-modal');
    } catch (err) {
      showAlert('pat-alert', err.data?.message || 'Unable to open patient record.', 'error');
    }
  };

  function openCreatePatient() {
    document.getElementById('patient-modal-title').textContent = 'Create Patient';
    document.getElementById('patient-form-btn').textContent = 'Create patient';
    document.getElementById('patient-editing-id').value = '';
    document.getElementById('patient-form').reset();
    openModal('patient-form-modal');
  }

  window.editPatient = function (id, name, age, gender, phone, address) {
    document.getElementById('patient-modal-title').textContent = 'Edit Patient';
    document.getElementById('patient-form-btn').textContent = 'Save changes';
    document.getElementById('patient-editing-id').value = id;
    const form = document.getElementById('patient-form');
    form.name.value = name;
    form.age.value = age;
    form.gender.value = gender;
    form.phone.value = phone;
    form.address.value = address;
    openModal('patient-form-modal');
  };

  window.deletePatient = async function (id, name) {
    if (!confirm(`Delete patient record for ${name}?`)) return;
    try {
      await api.delete(`/patients/${id}`);
      showAlert('pat-alert', 'Patient deleted successfully.', 'success');
      loadPatients();
    } catch (err) {
      showAlert('pat-alert', err.data?.message || 'Unable to delete patient.', 'error');
    }
  };

  document.getElementById('patient-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const editingId = form.editingId?.value;
    const payload = {
      name: form.name.value,
      age: Number(form.age.value),
      gender: form.gender.value,
      phone: form.phone.value,
      address: form.address.value,
    };

    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, payload);
        showAlert('pat-alert', 'Patient updated successfully.', 'success');
      } else {
        await api.post('/patients', payload);
        showAlert('pat-alert', 'Patient created successfully.', 'success');
      }
      closeModal('patient-form-modal');
      loadPatients();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('pat-alert', details || err.data?.message || 'Unable to save patient.', 'error');
    }
  });
})();
