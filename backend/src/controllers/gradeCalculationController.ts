import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { DEFAULT_GRADE_SCALE, parseScale, GradeScale } from '../constants';
import { computeResult } from '../services/gradeCalc';

export const calculateGrades = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (courseResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this course' });
    }

    const componentsResult = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id',
      [courseId]
    );

    const scaleResult = await pool.query(
      'SELECT scale FROM grade_scales WHERE course_id = $1',
      [courseId]
    );

    let scale: GradeScale = DEFAULT_GRADE_SCALE;
    if (scaleResult.rows.length > 0) {
      try {
        scale = parseScale(scaleResult.rows[0].scale);
      } catch (parseError) {
        console.error(`Failed to parse grade scale for course ${courseId}, using default:`, parseError);
      }
    }

    res.json(computeResult(componentsResult.rows, scale));
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate grades' });
  }
};

export const calculateAllGrades = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const coursesResult = await pool.query('SELECT id FROM courses WHERE user_id = $1', [userId]);
    const courseIds = coursesResult.rows.map((row) => row.id);

    if (courseIds.length === 0) {
      return res.json({});
    }

    const componentsResult = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = ANY($1) ORDER BY id',
      [courseIds]
    );
    const scalesResult = await pool.query(
      'SELECT course_id, scale FROM grade_scales WHERE course_id = ANY($1)',
      [courseIds]
    );

    const componentsByCourse = new Map<number, any[]>();
    componentsResult.rows.forEach((comp) => {
      const list = componentsByCourse.get(comp.course_id) || [];
      list.push(comp);
      componentsByCourse.set(comp.course_id, list);
    });

    const scaleByCourse = new Map<number, GradeScale>();
    scalesResult.rows.forEach((row) => {
      try {
        scaleByCourse.set(row.course_id, parseScale(row.scale));
      } catch (parseError) {
        console.error(`Failed to parse grade scale for course ${row.course_id}, using default:`, parseError);
      }
    });

    const results: { [key: number]: ReturnType<typeof computeResult> } = {};
    courseIds.forEach((id) => {
      try {
        const scale = scaleByCourse.get(id) || DEFAULT_GRADE_SCALE;
        results[id] = computeResult(componentsByCourse.get(id) || [], scale);
      } catch (courseError) {
        console.error(`Failed to compute grades for course ${id}, skipping:`, courseError);
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate grades' });
  }
};
