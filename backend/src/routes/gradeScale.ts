import express from 'express';
import { getGradeScale, updateGradeScale } from '../controllers/gradeScaleController';
import { authenticate } from '../middleware';

const router = express.Router();

router.use(authenticate);

router.get('/:courseId', getGradeScale);
router.put('/:courseId', updateGradeScale);

export default router;
