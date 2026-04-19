import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLinkedProfileId } from '../utils/profile.js';

export const listBills = asyncHandler(async (req, res) => {
  let patientId = req.query.patientId ? Number(req.query.patientId) : null;
  const status = req.query.status || null;

  if (req.user.role === 'patient') {
    patientId = await getLinkedProfileId(req.user.id, 'patient');
  }

  const [rows] = await pool.query(
    `SELECT b.id, b.patient_id, b.appointment_id, b.amount, b.status, b.date, b.paid_at, b.created_at,
            p.name AS patient_name, d.name AS doctor_name, a.date AS appointment_date
     FROM bills b
     INNER JOIN patients p ON p.id = b.patient_id
     INNER JOIN appointments a ON a.id = b.appointment_id
     INNER JOIN doctors d ON d.id = a.doctor_id
     WHERE (? IS NULL OR b.patient_id = ?)
       AND (? IS NULL OR b.status = ?)
     ORDER BY b.date DESC`,
    [patientId, patientId, status, status],
  );

  res.json({ bills: rows });
});

export const createBill = asyncHandler(async (req, res) => {
  const { patient_id, appointment_id, amount } = req.body;

  const [[appointment]] = await pool.query(
    `SELECT id, patient_id, status
     FROM appointments
     WHERE id = ?`,
    [appointment_id],
  );

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  if (appointment.patient_id !== patient_id) {
    throw new AppError('Appointment does not belong to the selected patient.', 400);
  }

  const [result] = await pool.query(
    `INSERT INTO bills (patient_id, appointment_id, amount, status, date)
     VALUES (?, ?, ?, 'unpaid', NOW())`,
    [patient_id, appointment_id, amount],
  );

  const [rows] = await pool.query('SELECT * FROM bills WHERE id = ?', [result.insertId]);

  res.status(201).json({
    message: 'Bill generated successfully.',
    bill: rows[0],
  });
});

export const payBill = asyncHandler(async (req, res) => {
  const billId = Number(req.params.id);

  const [[bill]] = await pool.query('SELECT id, patient_id, status FROM bills WHERE id = ?', [billId]);

  if (!bill) {
    throw new AppError('Bill not found.', 404);
  }

  if (req.user.role === 'patient') {
    const linkedPatientId = await getLinkedProfileId(req.user.id, 'patient');
    if (linkedPatientId !== bill.patient_id) {
      throw new AppError('You can only pay your own bills.', 403);
    }
  }

  if (bill.status === 'paid') {
    throw new AppError('Bill has already been paid.', 400);
  }

  await pool.query(
    `UPDATE bills
     SET status = 'paid', paid_at = NOW()
     WHERE id = ?`,
    [billId],
  );

  res.json({ message: 'Payment simulated successfully. Bill marked as paid.' });
});
