import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import { authenticate } from '../middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createCourse);
router.get('/', getCourses);
router.get('/:courseId', getCourseById);
router.put('/:courseId', updateCourse);
router.delete('/:courseId', deleteCourse);

export default router;
