import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/overview', authorize('admin'), getDashboardOverview);

export default router;
