import express from 'express';
import { calculateGrades, calculateAllGrades } from '../controllers/gradeCalculationController';
import { authenticate } from '../middleware';

const router = express.Router();

router.use(authenticate);

router.get('/', calculateAllGrades);
router.get('/:courseId', calculateGrades);

export default router;
