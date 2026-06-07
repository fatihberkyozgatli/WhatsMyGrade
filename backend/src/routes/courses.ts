import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import { parseSyllabus, createCourseFromDraft } from '../controllers/syllabusController';
import { authenticate } from '../middleware';

const router = express.Router();

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

const uploadPdf = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      return res.status(400).json({ error: message });
    }
    next();
  });
};

const parseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many syllabus uploads, please try again later' },
});

router.post('/', createCourse);
router.post('/parse-syllabus', uploadPdf, parseLimiter, parseSyllabus);
router.post('/from-draft', createCourseFromDraft);
router.get('/', getCourses);
router.get('/:courseId', getCourseById);
router.put('/:courseId', updateCourse);
router.delete('/:courseId', deleteCourse);

export default router;
