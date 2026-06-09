import express from 'express';
import { parseGradeEntry } from '../controllers/gradeEntryController';
import { authenticate } from '../middleware';

const router = express.Router();

router.post('/:courseId', authenticate, parseGradeEntry);

export default router;
