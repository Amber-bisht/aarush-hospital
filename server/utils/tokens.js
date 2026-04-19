import jwt from 'jsonwebtoken';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
  );

export const buildTokenPair = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});
