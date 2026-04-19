import express from 'express';
import {
  createPatient,
  deletePatient,
  getPatientById,
  listPatients,
  updatePatient,
} from '../controllers/patientController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { patientSchema } from '../utils/schemas.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'doctor'), listPatients);
router.get('/:id', authorize('admin', 'doctor', 'patient'), getPatientById);
router.post('/', authorize('admin'), validate(patientSchema), createPatient);
router.put('/:id', authorize('admin'), validate(patientSchema), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

export default router;
