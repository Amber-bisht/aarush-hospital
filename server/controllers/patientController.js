import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLinkedProfileId } from '../utils/profile.js';

export const listPatients = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim() || '';
  const likeTerm = `%${search}%`;

  const [rows] = await pool.query(
    `SELECT p.id, p.user_id, p.name, p.age, p.gender, p.phone, p.address, p.created_at, u.email
     FROM patients p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.name LIKE ? OR p.phone LIKE ?
     ORDER BY p.created_at DESC`,
    [likeTerm, likeTerm],
  );

  res.json({ patients: rows });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const patientId = Number(req.params.id);

  if (req.user.role === 'patient') {
    const linkedPatientId = await getLinkedProfileId(req.user.id, 'patient');
    if (linkedPatientId !== patientId) {
      throw new AppError('You can only access your own record.', 403);
    }
  }

  const [patientRows] = await pool.query(
    `SELECT p.id, p.user_id, p.name, p.age, p.gender, p.phone, p.address, p.created_at, u.email
     FROM patients p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [patientId],
  );

  const patient = patientRows[0];

  if (!patient) {
    throw new AppError('Patient not found.', 404);
  }

  const [appointments] = await pool.query(
    `SELECT a.id, a.date, a.status, a.reason, a.notes, d.id AS doctor_id, d.name AS doctor_name, d.specialization
     FROM appointments a
     INNER JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = ?
     ORDER BY a.date DESC`,
    [patientId],
  );

  const [prescriptions] = await pool.query(
    `SELECT pr.id, pr.appointment_id, pr.diagnosis, pr.medicines, pr.notes, pr.created_at,
            d.id AS doctor_id, d.name AS doctor_name
     FROM prescriptions pr
     INNER JOIN doctors d ON d.id = pr.doctor_id
     WHERE pr.patient_id = ?
     ORDER BY pr.created_at DESC`,
    [patientId],
  );

  const [bills] = await pool.query(
    `SELECT b.id, b.amount, b.status, b.date, b.paid_at, b.appointment_id
     FROM bills b
     WHERE b.patient_id = ?
     ORDER BY b.date DESC`,
    [patientId],
  );

  res.json({
    patient,
    appointments,
    prescriptions,
    bills,
  });
});

export const createPatient = asyncHandler(async (req, res) => {
  const { name, age, gender, phone, address } = req.body;

  const [result] = await pool.query(
    `INSERT INTO patients (name, age, gender, phone, address)
     VALUES (?, ?, ?, ?, ?)`,
    [name, age, gender, phone, address],
  );

  const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);

  res.status(201).json({
    message: 'Patient created successfully.',
    patient: rows[0],
  });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patientId = Number(req.params.id);
  const { name, age, gender, phone, address } = req.body;

  const [result] = await pool.query(
    `UPDATE patients
     SET name = ?, age = ?, gender = ?, phone = ?, address = ?
     WHERE id = ?`,
    [name, age, gender, phone, address, patientId],
  );

  if (!result.affectedRows) {
    throw new AppError('Patient not found.', 404);
  }

  const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [patientId]);

  res.json({
    message: 'Patient updated successfully.',
    patient: rows[0],
  });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patientId = Number(req.params.id);

  const [result] = await pool.query('DELETE FROM patients WHERE id = ?', [patientId]);

  if (!result.affectedRows) {
    throw new AppError('Patient not found.', 404);
  }

  res.json({ message: 'Patient deleted successfully.' });
});
