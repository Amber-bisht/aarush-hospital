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
        'Live operational metrics, appointment load, and revenue visibility for administrators.'
      )}
      <div id="dash-alert"></div>
      <div id="dash-stats" class="grid gap-4 md-grid-2 xl-grid-4"></div>
      <div class="grid gap-6 xl-grid-1-4-1">
        <div class="glass-panel" style="padding: 1.5rem;">
          <h2 class="section-title">Appointments Per Day</h2>
          <p class="mt-2 text-sm text-muted">Seven-day booking and visit trend.</p>
          <div class="mt-6" style="position: relative; height: 280px;">
            <canvas id="chart-appointments"></canvas>
          </div>
        </div>
        <div class="glass-panel" style="padding: 1.5rem;">
          <h2 class="section-title">Revenue Trends</h2>
          <p class="mt-2 text-sm text-muted">Paid revenue captured over the last week.</p>
          <div class="mt-6" style="position: relative; height: 280px;">
            <canvas id="chart-revenue"></canvas>
          </div>
          <div id="dash-status-breakdown" class="mt-6 grid gap-3 grid-3"></div>
        </div>
      </div>
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

      // Charts
      const labels = data.charts.appointmentsPerDay.map(item => item.day);
      const appointmentValues = data.charts.appointmentsPerDay.map(item => item.total);
      const revenueValues = data.charts.revenueTrends.map(item => item.total);

      new Chart(document.getElementById('chart-appointments'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Appointments',
            data: appointmentValues,
            borderColor: '#ff2e88',
            backgroundColor: 'rgba(255, 46, 136, 0.15)',
            tension: 0.35,
            fill: true,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });

      new Chart(document.getElementById('chart-revenue'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Revenue',
            data: revenueValues,
            backgroundColor: '#111111',
            borderRadius: 12,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });

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
