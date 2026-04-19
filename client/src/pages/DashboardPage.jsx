import { useEffect, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await dashboardService.getOverview();
        setData(response);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard.');
      }
    };

    loadOverview();
  }, []);

  const appointmentLabels = data?.charts.appointmentsPerDay.map((item) => item.day) || [];
  const appointmentValues = data?.charts.appointmentsPerDay.map((item) => item.total) || [];
  const revenueValues = data?.charts.revenueTrends.map((item) => item.total) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital command center"
        subtitle="Live operational metrics, appointment load, and revenue visibility for administrators."
      />

      {error ? (
        <div className="rounded-3xl bg-app-accent/10 px-5 py-4 text-sm font-medium text-app-accent">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={data?.stats.totalPatients ?? '--'} helper="Active patient records" />
        <StatCard label="Total doctors" value={data?.stats.totalDoctors ?? '--'} helper="Clinicians onboarded" />
        <StatCard
          label="Appointments"
          value={data?.stats.totalAppointments ?? '--'}
          helper="Scheduled, completed, and cancelled"
        />
        <StatCard
          label="Collected revenue"
          value={data ? formatCurrency(data.stats.totalRevenue) : '--'}
          helper="Paid bills only"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel p-6">
          <h2 className="section-title">Appointments Per Day</h2>
          <p className="mt-2 text-sm text-app-muted">Seven-day booking and visit trend.</p>
          <div className="mt-6">
            <Line
              data={{
                labels: appointmentLabels,
                datasets: [
                  {
                    label: 'Appointments',
                    data: appointmentValues,
                    borderColor: '#ff2e88',
                    backgroundColor: 'rgba(255, 46, 136, 0.15)',
                    tension: 0.35,
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
              height={280}
            />
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="section-title">Revenue Trends</h2>
          <p className="mt-2 text-sm text-app-muted">Paid revenue captured over the last week.</p>
          <div className="mt-6">
            <Bar
              data={{
                labels: appointmentLabels,
                datasets: [
                  {
                    label: 'Revenue',
                    data: revenueValues,
                    backgroundColor: '#111111',
                    borderRadius: 12,
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
              height={280}
            />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {Object.entries(data?.charts.statusBreakdown || {}).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-app-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-app-muted">{label}</p>
                <p className="mt-2 text-xl font-bold text-app-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
