import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import componentRoutes from './routes/components';
import gradeScaleRoutes from './routes/gradeScale';
import calculateRoutes from './routes/calculate';

const app = express();

app.set('trust proxy', config.trust_proxy);
app.use(cors({ origin: config.cors_origin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/grade-scale', gradeScaleRoutes);
app.use('/api/calculate', calculateRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
