import pool from '../db/connection.js';
import asyncHandler from '../utils/asyncHandler.js';

const fillDateSeries = (rows) => {
  const map = new Map(rows.map((row) => [row.day, Number(row.total)]));
  const output = [];
  const formatKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = formatKey(date);
    output.push({
      day: key,
      total: map.get(key) || 0,
    });
  }

  return output;
};

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const [[stats]] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM patients) AS totalPatients,
      (SELECT COUNT(*) FROM doctors) AS totalDoctors,
      (SELECT COUNT(*) FROM appointments) AS totalAppointments,
      (SELECT COALESCE(SUM(amount), 0) FROM bills WHERE status = 'paid') AS totalRevenue`
  );

  const [appointmentTrendRows] = await pool.query(
    `SELECT DATE(date) AS day, COUNT(*) AS total
     FROM appointments
     WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(date)
     ORDER BY day ASC`
  );

  const [revenueTrendRows] = await pool.query(
    `SELECT DATE(date) AS day, COALESCE(SUM(amount), 0) AS total
     FROM bills
     WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       AND status = 'paid'
     GROUP BY DATE(date)
     ORDER BY day ASC`
  );

  const [[statusBreakdown]] = await pool.query(
    `SELECT
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM appointments`
  );

  res.json({
    stats: {
      totalPatients: Number(stats.totalPatients),
      totalDoctors: Number(stats.totalDoctors),
      totalAppointments: Number(stats.totalAppointments),
      totalRevenue: Number(stats.totalRevenue),
    },
    charts: {
      appointmentsPerDay: fillDateSeries(appointmentTrendRows),
      revenueTrends: fillDateSeries(revenueTrendRows),
      statusBreakdown: {
        scheduled: Number(statusBreakdown.scheduled || 0),
        completed: Number(statusBreakdown.completed || 0),
        cancelled: Number(statusBreakdown.cancelled || 0),
      },
    },
  });
});
