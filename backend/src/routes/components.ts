import express from 'express';
import {
  createComponent,
  getComponents,
  updateComponent,
  deleteComponent,
} from '../controllers/gradeComponentController';
import { authenticate } from '../middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createComponent);
router.get('/:courseId', getComponents);
router.put('/:componentId', updateComponent);
router.delete('/:componentId', deleteComponent);

export default router;
