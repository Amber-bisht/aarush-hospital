/**
 * Register page logic.
 */
(function () {
  if (auth.isAuthenticated()) {
    window.location.href = getDefaultRouteForRole(auth.getUser().role);
    return;
  }

  const form = document.getElementById('register-form');
  const btn = document.getElementById('register-btn');
  const roleSelect = document.getElementById('reg-role');
  const namePhoneGroup = document.getElementById('name-phone-group');
  const patientFields = document.getElementById('patient-fields');
  const doctorFields = document.getElementById('doctor-fields');
  const nameLabel = document.getElementById('name-label');

  function updateRoleFields() {
    const role = roleSelect.value;

    // Show name/phone for patient & doctor, hide for admin
    if (role === 'admin') {
      namePhoneGroup.classList.add('hidden');
      namePhoneGroup.querySelectorAll('input').forEach(i => i.removeAttribute('required'));
    } else {
      namePhoneGroup.classList.remove('hidden');
      namePhoneGroup.querySelectorAll('input').forEach(i => i.setAttribute('required', ''));
      nameLabel.textContent = role === 'doctor' ? 'Doctor name' : 'Patient name';
    }

    // Patient-only
    if (role === 'patient') {
      patientFields.classList.remove('hidden');
      patientFields.querySelectorAll('input').forEach(i => i.setAttribute('required', ''));
    } else {
      patientFields.classList.add('hidden');
      patientFields.querySelectorAll('input').forEach(i => i.removeAttribute('required'));
    }

    // Doctor-only
    if (role === 'doctor') {
      doctorFields.classList.remove('hidden');
      doctorFields.querySelector('input').setAttribute('required', '');
    } else {
      doctorFields.classList.add('hidden');
      doctorFields.querySelector('input')?.removeAttribute('required');
    }
  }

  roleSelect.addEventListener('change', updateRoleFields);
  updateRoleFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('register-alert');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // Clean up payload based on role
    if (payload.role === 'patient') {
      payload.age = Number(payload.age);
      delete payload.specialization;
    } else if (payload.role === 'doctor') {
      delete payload.age;
      delete payload.gender;
      delete payload.address;
    } else {
      // admin
      delete payload.name;
      delete payload.phone;
      delete payload.age;
      delete payload.gender;
      delete payload.address;
      delete payload.specialization;
    }

    try {
      const data = await auth.register(payload);
      window.location.href = getDefaultRouteForRole(data.user.role);
    } catch (err) {
      const details = err.data?.details?.join(' ');
      showAlert('register-alert', details || err.data?.message || 'Unable to register.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create account';
    }
  });
})();
