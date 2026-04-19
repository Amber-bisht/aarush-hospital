import express from 'express';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor,
} from '../controllers/doctorController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { doctorSchema } from '../utils/schemas.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'doctor', 'patient'), listDoctors);
router.get('/:id', authorize('admin', 'doctor', 'patient'), getDoctorById);
router.post('/', authorize('admin'), validate(doctorSchema), createDoctor);
router.put('/:id', authorize('admin'), validate(doctorSchema), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

export default router;
