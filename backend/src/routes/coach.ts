import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware';
import { chatWithCoach } from '../controllers/coachController';

const router = Router();

const coachLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to Grade Coach, please slow down.' },
});

router.post('/:courseId', authenticate, coachLimiter, chatWithCoach);

export default router;
