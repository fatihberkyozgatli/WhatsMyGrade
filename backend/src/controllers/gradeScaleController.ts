import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { DEFAULT_GRADE_SCALE, parseScale } from '../constants';
import Joi from 'joi';

const rangeSchema = Joi.object({
  min: Joi.number().min(0).max(100).required(),
  max: Joi.number().min(Joi.ref('min')).max(100).required(),
});

const scaleSchema = Joi.object({
  A: rangeSchema.required(),
  B: rangeSchema.required(),
  C: rangeSchema.required(),
  D: rangeSchema.required(),
  F: rangeSchema.required(),
});

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
      return res.json(DEFAULT_GRADE_SCALE);
    }

    res.json(parseScale(result.rows[0].scale));
  } catch (error) {
    console.error('Fetch grade scale error:', error);
    res.status(500).json({ error: 'Failed to fetch grade scale' });
  }
};

export const updateGradeScale = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  const { error: validationError, value: scale } = scaleSchema.validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError.details[0].message });
  }

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
      return res.json(parseScale(result.rows[0].scale));
    }

    const result = await pool.query(
      'INSERT INTO grade_scales (course_id, scale) VALUES ($1, $2) RETURNING *',
      [courseId, JSON.stringify(scale)]
    );

    res.status(201).json(parseScale(result.rows[0].scale));
  } catch (error) {
    console.error('Update grade scale error:', error);
    res.status(500).json({ error: 'Failed to update grade scale' });
  }
};
