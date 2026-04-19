import Joi from 'joi';

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err instanceof Joi.ValidationError) {
    return res.status(400).json({
      message: 'Validation failed.',
      details: err.details.map((detail) => detail.message),
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'A record with the same unique value already exists.',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }

  return res.status(statusCode).json({
    message: err.message || 'Something went wrong.',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
};

export default errorMiddleware;
