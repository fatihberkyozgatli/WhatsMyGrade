import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', authenticate, getProfile);

export default router;
