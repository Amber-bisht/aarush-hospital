import express from 'express';
import { createBill, listBills, payBill } from '../controllers/billingController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { billSchema } from '../utils/schemas.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'patient'), listBills);
router.post('/', authorize('admin'), validate(billSchema), createBill);
router.patch('/:id/pay', authorize('admin', 'patient'), payBill);

export default router;
