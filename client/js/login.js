/**
 * Login page logic.
 */
(function () {
  // If already logged in, redirect to the appropriate page
  if (auth.isAuthenticated()) {
    window.location.href = getDefaultRouteForRole(auth.getUser().role);
    return;
  }

  const form = document.getElementById('login-form');
  const btn = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('login-alert');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const data = await auth.login({ email, password });
      const route = getDefaultRouteForRole(data.user.role);
      window.location.href = route;
    } catch (err) {
      showAlert('login-alert', err.data?.message || 'Unable to sign in. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
})();
