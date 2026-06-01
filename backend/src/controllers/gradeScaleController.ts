import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';

export const getGradeScale = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT gs.* FROM grade_scales gs
       JOIN courses c ON gs.course_id = c.id
       WHERE gs.course_id = $1 AND c.user_id = $2`,
      [courseId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89.99 },
        C: { min: 70, max: 79.99 },
        D: { min: 60, max: 69.99 },
        F: { min: 0, max: 59.99 },
      });
    }

    res.json(JSON.parse(result.rows[0].scale));
  } catch (error) {
    console.error('Fetch grade scale error:', error);
    res.status(500).json({ error: 'Failed to fetch grade scale' });
  }
};

export const updateGradeScale = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;
  const scale = req.body;

  try {
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
      [courseId, userId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    const existing = await pool.query(
      'SELECT * FROM grade_scales WHERE course_id = $1',
      [courseId]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE grade_scales SET scale = $1 WHERE course_id = $2 RETURNING *',
        [JSON.stringify(scale), courseId]
      );
      return res.json(JSON.parse(result.rows[0].scale));
    }

    const result = await pool.query(
      'INSERT INTO grade_scales (course_id, scale) VALUES ($1, $2) RETURNING *',
      [courseId, JSON.stringify(scale)]
    );

    res.status(201).json(JSON.parse(result.rows[0].scale));
  } catch (error) {
    console.error('Update grade scale error:', error);
    res.status(500).json({ error: 'Failed to update grade scale' });
  }
};
