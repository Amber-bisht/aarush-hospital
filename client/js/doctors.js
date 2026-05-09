/**
 * Doctors page logic.
 */
(function () {
  if (!auth.guard(['admin', 'doctor', 'patient'])) return;

  const user = auth.getUser();
  const isDoctorSelf = user.role === 'doctor';
  const canManage = user.role === 'admin';
  const content = document.getElementById('page-content');

  if (isDoctorSelf) {
    renderSelfProfile();
  } else {
    renderDoctorDirectory();
  }

  /* ── Doctor Self Profile ── */
  async function renderSelfProfile() {
    content.innerHTML = `
      <div class="space-y-6">
        ${renderPageHeader('Doctor profile', 'Your current specialization details and assigned appointment workload.')}
        <div id="doc-alert"></div>
        <div id="doc-self-body">
          <p class="text-sm text-muted">Loading profile...</p>
        </div>
      </div>
    `;

    try {
      const data = await api.get(`/doctors/${user.profile.id}`);
      const doctor = data.doctor;
      const appointments = data.appointments || [];

      document.getElementById('doc-self-body').innerHTML = `
        <div class="grid gap-6 xl-grid-0-95-1-05">
          <div class="glass-panel" style="padding: 1.5rem;">
            <h2 class="section-title">Profile</h2>
            <div class="mt-6 grid gap-4 sm-grid-2">
              ${renderInfoBox('Name', doctor?.name)}
              ${renderInfoBox('Email', doctor?.email)}
              ${renderInfoBox('Phone', doctor?.phone)}
              ${renderInfoBox('Specialization', doctor?.specialization)}
            </div>
          </div>
          <div class="glass-panel" style="padding: 1.5rem;">
            <h2 class="section-title">Workload</h2>
            <div class="mt-6 grid gap-4 sm-grid-3">
              ${['scheduled', 'completed', 'cancelled'].map(status =>
                renderInfoBox(status, appointments.filter(a => a.status === status).length, true)
              ).join('')}
            </div>
          </div>
        </div>
        ${renderDataTable(
          [
            { key: 'patient_name', header: 'Patient' },
            { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
            { key: 'reason', header: 'Reason' },
            { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
          ],
          appointments,
          'No assigned appointments yet.'
        )}
      `;
    } catch (err) {
      showAlert('doc-alert', err.data?.message || 'Unable to load doctor profile.', 'error');
    }
  }

  /* ── Doctor Directory (Admin / Patient view) ── */
  let searchQuery = '';

  async function renderDoctorDirectory() {
    content.innerHTML = `
      <div class="space-y-6">
        ${renderPageHeader(
          'Doctor directory',
          'Manage doctor profiles or browse clinician specializations across the hospital.',
          `
            <input class="field-input" style="min-width: 15rem;" placeholder="Search by doctor or specialization" id="doc-search">
            <button type="button" class="btn-secondary" id="doc-search-btn">Search</button>
            ${canManage ? '<button type="button" class="btn-primary" id="doc-add-btn">Add doctor</button>' : ''}
          `
        )}
        <div id="doc-alert"></div>
        <div id="doc-table">
          <p class="text-sm text-muted">Loading doctors...</p>
        </div>
      </div>
    `;

    document.getElementById('doc-search-btn').addEventListener('click', () => {
      searchQuery = document.getElementById('doc-search').value;
      loadDoctors();
    });

    document.getElementById('doc-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchQuery = e.target.value;
        loadDoctors();
      }
    });

    if (canManage) {
      document.getElementById('doc-add-btn').addEventListener('click', () => {
        openCreateDoctor();
      });
    }

    loadDoctors();
  }

  async function loadDoctors() {
    try {
      const data = await api.get('/doctors', { search: searchQuery });
      const doctors = data.doctors;

      document.getElementById('doc-table').innerHTML = renderDataTable(
        [
          { key: 'name', header: 'Doctor' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'phone', header: 'Phone' },
          { key: 'upcoming_appointments', header: 'Upcoming' },
        ],
        doctors,
        'No doctors matched your search.',
        (row) => {
          let btns = `<button class="btn-secondary" onclick="viewDoctor(${row.id})">View</button>`;
          if (canManage) {
            btns += ` <button class="btn-secondary" onclick="editDoctor(${row.id}, '${escapeHtml(row.name)}', '${escapeHtml(row.specialization)}', '${escapeHtml(row.phone)}')">Edit</button>`;
            btns += ` <button class="btn-danger" onclick="deleteDoctor(${row.id}, '${escapeHtml(row.name)}')">Delete</button>`;
          }
          return `<div class="flex flex-wrap gap-2">${btns}</div>`;
        }
      );
    } catch (err) {
      showAlert('doc-alert', err.data?.message || 'Unable to load doctors.', 'error');
    }
  }

  /* ── CRUD handlers (global) ── */
  window.viewDoctor = async function (id) {
    try {
      const data = await api.get(`/doctors/${id}`);
      document.getElementById('doctor-detail-title').textContent = data.doctor?.name || 'Doctor profile';
      document.getElementById('doctor-detail-body').innerHTML = `
        <div class="grid gap-4 sm-grid-2">
          ${renderInfoBox('Email', data.doctor?.email)}
          ${renderInfoBox('Phone', data.doctor?.phone)}
          ${renderInfoBox('Specialization', data.doctor?.specialization)}
          ${renderInfoBox('Created', formatDateTime(data.doctor?.created_at))}
        </div>
        ${renderDataTable(
          [
            { key: 'patient_name', header: 'Patient' },
            { key: 'date', header: 'Date', render: r => formatDateTime(r.date) },
            { key: 'status', header: 'Status', render: r => renderBadge(r.status) },
          ],
          data.appointments || [],
          'No visible appointments for this profile.'
        )}
      `;
      openModal('doctor-detail-modal');
    } catch (err) {
      showAlert('doc-alert', err.data?.message || 'Unable to open doctor record.', 'error');
    }
  };

  function openCreateDoctor() {
    document.getElementById('doctor-modal-title').textContent = 'Create Doctor';
    document.getElementById('doctor-form-btn').textContent = 'Create doctor';
    document.getElementById('doctor-editing-id').value = '';
    document.getElementById('doctor-form').reset();
    openModal('doctor-form-modal');
  }

  window.editDoctor = function (id, name, spec, phone) {
    document.getElementById('doctor-modal-title').textContent = 'Edit Doctor';
    document.getElementById('doctor-form-btn').textContent = 'Save changes';
    document.getElementById('doctor-editing-id').value = id;
    const form = document.getElementById('doctor-form');
    form.name.value = name;
    form.specialization.value = spec;
    form.phone.value = phone;
    openModal('doctor-form-modal');
  };

  window.deleteDoctor = async function (id, name) {
    if (!confirm(`Delete doctor profile for ${name}?`)) return;
    try {
      await api.delete(`/doctors/${id}`);
      showAlert('doc-alert', 'Doctor deleted successfully.', 'success');
      loadDoctors();
    } catch (err) {
      showAlert('doc-alert', err.data?.message || 'Unable to delete doctor.', 'error');
    }
  };

  // Form submit
  document.getElementById('doctor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const editingId = form.editingId?.value;
    const payload = {
      name: form.name.value,
      specialization: form.specialization.value,
      phone: form.phone.value,
    };

    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, payload);
        showAlert('doc-alert', 'Doctor updated successfully.', 'success');
      } else {
        await api.post('/doctors', payload);
        showAlert('doc-alert', 'Doctor created successfully.', 'success');
      }
      closeModal('doctor-form-modal');
      loadDoctors();
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('doc-alert', details || err.data?.message || 'Unable to save doctor.', 'error');
    }
  });
})();
