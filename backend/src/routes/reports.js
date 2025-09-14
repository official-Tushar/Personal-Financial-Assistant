import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { byCategory, summary, timeline } from '../controllers/reportsController.js';

const router = Router();

router.use(authRequired);
router.get('/summary', summary);
router.get('/by-category', byCategory);
router.get('/timeline', timeline);

export default router;

