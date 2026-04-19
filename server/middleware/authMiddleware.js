import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authorization token is required.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  const [rows] = await pool.query(
    'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
    [decoded.sub],
  );

  const user = rows[0];

  if (!user) {
    throw new AppError('The user linked to this token no longer exists.', 401);
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    return next();
  };
