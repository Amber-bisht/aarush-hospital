import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import AppError from './utils/appError.js';
import errorMiddleware from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
    credentials: false,
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    message: 'Hospital Management System API is running.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} was not found.`, 404));
});

app.use(errorMiddleware);

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`HMS API listening on port ${port}`);
});
