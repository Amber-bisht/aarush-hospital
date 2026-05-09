/**
 * Dashboard page – admin only.
 * Chart.js is loaded via CDN in the HTML.
 */
(function () {
  // Only admins can access the dashboard
  if (!auth.guard(['admin'])) return;

  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="space-y-6">
      ${renderPageHeader(
    'Hospital command center',
  )}
      <div id="dash-alert"></div>
      <div id="dash-stats" class="grid gap-4 md-grid-2 xl-grid-4"></div>
      <div id="dash-status-breakdown" class="grid gap-4 md-grid-3 mt-8"></div>
    </div>
  `;

  loadDashboard();

  async function loadDashboard() {
    try {
      const data = await api.get('/dashboard/overview');

      // Stats
      document.getElementById('dash-stats').innerHTML = [
        renderStatCard('Total patients', data.stats.totalPatients ?? '--', 'Active patient records'),
        renderStatCard('Total doctors', data.stats.totalDoctors ?? '--', 'Clinicians onboarded'),
        renderStatCard('Appointments', data.stats.totalAppointments ?? '--', 'Scheduled, completed, and cancelled'),
        renderStatCard('Collected revenue', data.stats.totalRevenue ? formatCurrency(data.stats.totalRevenue) : '--', 'Paid bills only'),
      ].join('');



      // Status breakdown
      const breakdown = data.charts.statusBreakdown || {};
      document.getElementById('dash-status-breakdown').innerHTML = Object.entries(breakdown).map(([label, value]) =>
        renderInfoBox(label, value, true)
      ).join('');
    } catch (err) {
      showAlert('dash-alert', err.data?.message || 'Unable to load dashboard.', 'error');
    }
  }
})();
