import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getProfileByUserId } from '../utils/profile.js';
import { buildTokenPair } from '../utils/tokens.js';

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const sanitizeUser = (user, profile) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
  profile,
});

const fetchUserRecord = async (userId, executor = pool) => {
  const [rows] = await executor.query(
    'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
    [userId],
  );
  return rows[0] || null;
};

export const register = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { email, password, role, name, age, gender, phone, address, specialization } = req.body;

    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length) {
      throw new AppError('Email is already registered.', 409);
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role],
    );

    const userId = userResult.insertId;

    if (role === 'patient') {
      await connection.query(
        `INSERT INTO patients (user_id, name, age, gender, phone, address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, age, gender, phone, address],
      );
    }

    if (role === 'doctor') {
      await connection.query(
        `INSERT INTO doctors (user_id, name, specialization, phone)
         VALUES (?, ?, ?, ?)`,
        [userId, name, specialization, phone],
      );
    }

    const user = await fetchUserRecord(userId, connection);
    const profile = await getProfileByUserId(userId, role, connection);
    const tokens = buildTokenPair(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, saltRounds);

    await connection.query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [
      refreshTokenHash,
      userId,
    ]);

    await connection.commit();

    res.status(201).json({
      message: 'Registration completed successfully.',
      user: sanitizeUser(user, profile),
      tokens,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    'SELECT id, email, role, password_hash, created_at, updated_at, refresh_token_hash FROM users WHERE email = ?',
    [email],
  );

  const user = rows[0];

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const matches = await bcrypt.compare(password, user.password_hash);

  if (!matches) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = buildTokenPair(user);
  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, saltRounds);

  await pool.query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [
    refreshTokenHash,
    user.id,
  ]);

  const profile = await getProfileByUserId(user.id, user.role);

  res.json({
    message: 'Login successful.',
    user: sanitizeUser(user, profile),
    tokens,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid refresh token.', 401);
  }

  const [rows] = await pool.query(
    'SELECT id, email, role, refresh_token_hash, created_at, updated_at FROM users WHERE id = ?',
    [decoded.sub],
  );

  const user = rows[0];

  if (!user?.refresh_token_hash) {
    throw new AppError('Refresh session has expired.', 401);
  }

  const matches = await bcrypt.compare(refreshToken, user.refresh_token_hash);

  if (!matches) {
    throw new AppError('Refresh session is invalid.', 401);
  }

  const tokens = buildTokenPair(user);
  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, saltRounds);

  await pool.query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [
    refreshTokenHash,
    user.id,
  ]);

  const profile = await getProfileByUserId(user.id, user.role);

  res.json({
    message: 'Token refreshed successfully.',
    user: sanitizeUser(user, profile),
    tokens,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await pool.query('UPDATE users SET refresh_token_hash = NULL WHERE id = ?', [decoded.sub]);
    } catch (error) {
      res.status(200).json({ message: 'Logout completed.' });
      return;
    }
  } else if (req.user?.id) {
    await pool.query('UPDATE users SET refresh_token_hash = NULL WHERE id = ?', [req.user.id]);
  }

  res.json({ message: 'Logout completed.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await fetchUserRecord(req.user.id);
  const profile = await getProfileByUserId(req.user.id, req.user.role);

  res.json({
    user: sanitizeUser(user, profile),
  });
});
