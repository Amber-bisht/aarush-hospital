import express from 'express';
import {
  addOrUpdatePrescription,
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  listAppointments,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import {
  appointmentRescheduleSchema,
  appointmentSchema,
  prescriptionSchema,
} from '../utils/schemas.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'doctor', 'patient'), listAppointments);
router.get('/:id', authorize('admin', 'doctor', 'patient'), getAppointmentById);
router.post('/', authorize('admin', 'patient'), validate(appointmentSchema), createAppointment);
router.patch(
  '/:id/reschedule',
  authorize('admin', 'doctor', 'patient'),
  validate(appointmentRescheduleSchema),
  rescheduleAppointment,
);
router.patch('/:id/cancel', authorize('admin', 'doctor', 'patient'), cancelAppointment);
router.post(
  '/:id/prescription',
  authorize('admin', 'doctor'),
  validate(prescriptionSchema),
  addOrUpdatePrescription,
);

export default router;
