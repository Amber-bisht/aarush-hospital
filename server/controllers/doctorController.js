import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLinkedProfileId } from '../utils/profile.js';

export const listDoctors = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim() || '';
  const likeTerm = `%${search}%`;

  const [rows] = await pool.query(
    `SELECT d.id, d.user_id, d.name, d.specialization, d.phone, d.created_at, u.email,
            COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) AS upcoming_appointments
     FROM doctors d
     LEFT JOIN users u ON u.id = d.user_id
     LEFT JOIN appointments a ON a.doctor_id = d.id
     WHERE d.name LIKE ? OR d.specialization LIKE ?
     GROUP BY d.id, d.user_id, d.name, d.specialization, d.phone, d.created_at, u.email
     ORDER BY d.created_at DESC`,
    [likeTerm, likeTerm],
  );

  res.json({ doctors: rows });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.id);

  const [doctorRows] = await pool.query(
    `SELECT d.id, d.user_id, d.name, d.specialization, d.phone, d.created_at, u.email
     FROM doctors d
     LEFT JOIN users u ON u.id = d.user_id
     WHERE d.id = ?`,
    [doctorId],
  );

  const doctor = doctorRows[0];

  if (!doctor) {
    throw new AppError('Doctor not found.', 404);
  }

  let appointments = [];

  if (req.user.role === 'admin' || req.user.role === 'doctor') {
    if (req.user.role === 'doctor') {
      const linkedDoctorId = await getLinkedProfileId(req.user.id, 'doctor');
      if (linkedDoctorId !== doctorId) {
        throw new AppError('You can only access your own appointment workload.', 403);
      }
    }

    const [appointmentRows] = await pool.query(
      `SELECT a.id, a.date, a.status, a.reason, a.notes,
              p.id AS patient_id, p.name AS patient_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = ?
       ORDER BY a.date DESC`,
      [doctorId],
    );
    appointments = appointmentRows;
  }

  res.json({
    doctor,
    appointments,
  });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, specialization, phone } = req.body;

  const [result] = await pool.query(
    `INSERT INTO doctors (name, specialization, phone)
     VALUES (?, ?, ?)`,
    [name, specialization, phone],
  );

  const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [result.insertId]);

  res.status(201).json({
    message: 'Doctor created successfully.',
    doctor: rows[0],
  });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.id);
  const { name, specialization, phone } = req.body;

  const [result] = await pool.query(
    `UPDATE doctors
     SET name = ?, specialization = ?, phone = ?
     WHERE id = ?`,
    [name, specialization, phone, doctorId],
  );

  if (!result.affectedRows) {
    throw new AppError('Doctor not found.', 404);
  }

  const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [doctorId]);

  res.json({
    message: 'Doctor updated successfully.',
    doctor: rows[0],
  });
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.id);
  const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [doctorId]);

  if (!result.affectedRows) {
    throw new AppError('Doctor not found.', 404);
  }

  res.json({ message: 'Doctor deleted successfully.' });
});
