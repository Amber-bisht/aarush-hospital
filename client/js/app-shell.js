/**
 * App Shell – injects sidebar and topbar into authenticated pages.
 * Each authenticated page includes this script.
 * The page body should have: <div id="app"></div>
 */

(function () {
  // Guard – redirect if not logged in
  if (!auth.guard()) return;

  const user = auth.getUser();
  const navItems = getNavigationByRole(user.role);
  const currentPath = window.location.pathname;

  // Determine page title
  const pageTitles = {
    '/dashboard.html': 'Admin Dashboard',
    '/patients.html': 'Patients',
    '/doctors.html': 'Doctors',
    '/appointments.html': 'Appointments',
    '/billing.html': 'Billing',
  };
  const title = pageTitles[currentPath] || 'Aarush Hospital Management';

  // Build sidebar nav links
  const navLinksHTML = navItems.map(item => {
    const isActive = currentPath === item.path;
    return `<a href="${item.path}" class="${isActive ? 'active' : ''}">${item.label}</a>`;
  }).join('');

  const userName = user.profile?.name || user.email;

  // Build the shell
  const shellHTML = `
    <!-- Sidebar overlay (mobile) -->
    <div id="sidebar-overlay" class="sidebar-overlay hidden" onclick="toggleSidebar(false)"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar closed">
      <div class="sidebar-brand">
        <h2 class="brand-name">Aarush Hospital</h2>
      </div>
      <div class="sidebar-user">
        <p class="user-name">${escapeHtml(userName)}</p>
        <p class="user-email">Logged in as ${escapeHtml(user.role)}</p>
      </div>
      <nav class="sidebar-nav">
        ${navLinksHTML}
      </nav>
    </aside>

    <!-- Main content area -->
    <main class="app-main">
      <div class="app-content">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button type="button" class="menu-btn" onclick="toggleSidebar(true)">Menu</button>
            <div>
              <p class="topbar-welcome">Welcome back</p>
              <h1 class="topbar-title">${escapeHtml(title)}</h1>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-chip outlined">
              <p class="chip-label">Today</p>
              <p class="chip-value">${formatTodayDate()}</p>
            </div>
            <div class="topbar-chip filled" style="background: var(--color-soft); color: var(--color-black);">
              <p class="chip-label">Account</p>
              <p class="chip-value">${escapeHtml(user.email)}</p>
            </div>
            <button type="button" class="btn-secondary" onclick="auth.logout()">Sign out</button>
          </div>
        </header>

        <!-- Page content injected here -->
        <div id="page-content"></div>
      </div>
    </main>
  `;

  document.getElementById('app').innerHTML = shellHTML;
})();

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (open) {
    sidebar.classList.remove('closed');
    overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('closed');
    overlay.classList.add('hidden');
  }
}

window.toggleSidebar = toggleSidebar;
