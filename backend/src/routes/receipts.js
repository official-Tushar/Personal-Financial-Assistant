import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { analyzeReceipt, uploadMiddleware } from '../controllers/receiptsController.js';

const router = Router();

router.use(authRequired);
router.post('/analyze', uploadMiddleware, analyzeReceipt);

export default router;

