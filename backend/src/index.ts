import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import componentRoutes from './routes/components';
import gradeScaleRoutes from './routes/gradeScale';
import calculateRoutes from './routes/calculate';

const app = express();

const allowedOrigins = config.cors_origin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = allowedOrigins.includes('*') ? true : allowedOrigins;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.set('trust proxy', config.trust_proxy);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '16kb' }));
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/grade-scale', gradeScaleRoutes);
app.use('/api/calculate', calculateRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
