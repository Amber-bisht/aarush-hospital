import pool from '../db/connection.js';

const getExecutor = (executor) => executor || pool;

export const getProfileByUserId = async (userId, role, executor) => {
  const db = getExecutor(executor);

  if (role === 'patient') {
    const [rows] = await db.query(
      `SELECT id, user_id, name, age, gender, phone, address, created_at
       FROM patients
       WHERE user_id = ?`,
      [userId],
    );
    return rows[0] || null;
  }

  if (role === 'doctor') {
    const [rows] = await db.query(
      `SELECT id, user_id, name, specialization, phone, created_at
       FROM doctors
       WHERE user_id = ?`,
      [userId],
    );
    return rows[0] || null;
  }

  return null;
};

export const getLinkedProfileId = async (userId, role, executor) => {
  const profile = await getProfileByUserId(userId, role, executor);
  return profile?.id || null;
};
