import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLinkedProfileId } from '../utils/profile.js';

const resolveScopedFilters = async (req) => {
  const filters = {
    patientId: req.query.patientId ? Number(req.query.patientId) : null,
    doctorId: req.query.doctorId ? Number(req.query.doctorId) : null,
  };

  if (req.user.role === 'patient') {
    filters.patientId = await getLinkedProfileId(req.user.id, 'patient');
  }

  if (req.user.role === 'doctor') {
    filters.doctorId = await getLinkedProfileId(req.user.id, 'doctor');
  }

  return filters;
};

export const listAppointments = asyncHandler(async (req, res) => {
  const { patientId, doctorId } = await resolveScopedFilters(req);
  const status = req.query.status || null;
  const date = req.query.date || null;

  const [rows] = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.date, a.status, a.reason, a.notes, a.created_at, a.updated_at,
            p.name AS patient_name, d.name AS doctor_name, d.specialization,
            pr.id AS prescription_id, b.id AS bill_id, b.status AS bill_status
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN prescriptions pr ON pr.appointment_id = a.id
     LEFT JOIN bills b ON b.appointment_id = a.id
     WHERE (? IS NULL OR a.patient_id = ?)
       AND (? IS NULL OR a.doctor_id = ?)
       AND (? IS NULL OR a.status = ?)
       AND (? IS NULL OR DATE(a.date) = ?)
     ORDER BY a.date DESC`,
    [patientId, patientId, doctorId, doctorId, status, status, date, date],
  );

  res.json({ appointments: rows });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);

  const [rows] = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.date, a.status, a.reason, a.notes, a.created_at, a.updated_at,
            p.name AS patient_name, d.name AS doctor_name, d.specialization
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [appointmentId],
  );

  const appointment = rows[0];

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  if (req.user.role === 'patient') {
    const linkedPatientId = await getLinkedProfileId(req.user.id, 'patient');
    if (appointment.patient_id !== linkedPatientId) {
      throw new AppError('You can only view your own appointments.', 403);
    }
  }

  if (req.user.role === 'doctor') {
    const linkedDoctorId = await getLinkedProfileId(req.user.id, 'doctor');
    if (appointment.doctor_id !== linkedDoctorId) {
      throw new AppError('You can only view your own appointments.', 403);
    }
  }

  const [prescriptionRows] = await pool.query(
    `SELECT id, appointment_id, diagnosis, medicines, notes, created_at
     FROM prescriptions
     WHERE appointment_id = ?`,
    [appointmentId],
  );

  const [billRows] = await pool.query(
    `SELECT id, amount, status, date, paid_at
     FROM bills
     WHERE appointment_id = ?`,
    [appointmentId],
  );

  res.json({
    appointment,
    prescription: prescriptionRows[0] || null,
    bill: billRows[0] || null,
  });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, date, reason, notes } = req.body;

  let effectivePatientId = patient_id;

  if (req.user.role === 'patient') {
    effectivePatientId = await getLinkedProfileId(req.user.id, 'patient');
  }

  const [[patient]] = await pool.query('SELECT id FROM patients WHERE id = ?', [effectivePatientId]);
  const [[doctor]] = await pool.query('SELECT id FROM doctors WHERE id = ?', [doctor_id]);

  if (!patient) {
    throw new AppError('Patient does not exist.', 404);
  }

  if (!doctor) {
    throw new AppError('Doctor does not exist.', 404);
  }

  const [result] = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, date, status, reason, notes)
     VALUES (?, ?, ?, 'scheduled', ?, ?)`,
    [effectivePatientId, doctor_id, date, reason || null, notes || null],
  );

  const [rows] = await pool.query(
    `SELECT a.*, p.name AS patient_name, d.name AS doctor_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [result.insertId],
  );

  res.status(201).json({
    message: 'Appointment booked successfully.',
    appointment: rows[0],
  });
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { date } = req.body;

  const [[appointment]] = await pool.query(
    'SELECT id, patient_id, doctor_id, status FROM appointments WHERE id = ?',
    [appointmentId],
  );

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  if (appointment.status !== 'scheduled') {
    throw new AppError('Only scheduled appointments can be rescheduled.', 400);
  }

  if (req.user.role === 'patient') {
    const linkedPatientId = await getLinkedProfileId(req.user.id, 'patient');
    if (appointment.patient_id !== linkedPatientId) {
      throw new AppError('You can only reschedule your own appointments.', 403);
    }
  }

  if (req.user.role === 'doctor') {
    const linkedDoctorId = await getLinkedProfileId(req.user.id, 'doctor');
    if (appointment.doctor_id !== linkedDoctorId) {
      throw new AppError('You can only reschedule your own appointments.', 403);
    }
  }

  await pool.query('UPDATE appointments SET date = ? WHERE id = ?', [date, appointmentId]);

  res.json({ message: 'Appointment rescheduled successfully.' });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);

  const [[appointment]] = await pool.query(
    'SELECT id, patient_id, doctor_id, status FROM appointments WHERE id = ?',
    [appointmentId],
  );

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  if (req.user.role === 'patient') {
    const linkedPatientId = await getLinkedProfileId(req.user.id, 'patient');
    if (appointment.patient_id !== linkedPatientId) {
      throw new AppError('You can only cancel your own appointments.', 403);
    }
  }

  if (req.user.role === 'doctor') {
    const linkedDoctorId = await getLinkedProfileId(req.user.id, 'doctor');
    if (appointment.doctor_id !== linkedDoctorId) {
      throw new AppError('You can only cancel your own appointments.', 403);
    }
  }

  await pool.query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appointmentId]);

  res.json({ message: 'Appointment cancelled successfully.' });
});

export const addOrUpdatePrescription = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { diagnosis, medicines, notes } = req.body;

  const [[appointment]] = await pool.query(
    'SELECT id, patient_id, doctor_id FROM appointments WHERE id = ?',
    [appointmentId],
  );

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  if (req.user.role === 'doctor') {
    const linkedDoctorId = await getLinkedProfileId(req.user.id, 'doctor');
    if (appointment.doctor_id !== linkedDoctorId) {
      throw new AppError('You can only prescribe for your own appointments.', 403);
    }
  }

  await pool.query(
    `INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis, medicines, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       diagnosis = VALUES(diagnosis),
       medicines = VALUES(medicines),
       notes = VALUES(notes)`,
    [
      appointmentId,
      appointment.patient_id,
      appointment.doctor_id,
      diagnosis,
      medicines,
      notes || null,
    ],
  );

  await pool.query(`UPDATE appointments SET status = 'completed' WHERE id = ?`, [appointmentId]);

  res.json({ message: 'Prescription saved successfully.' });
});
