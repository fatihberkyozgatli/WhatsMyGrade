import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import Joi from 'joi';

const schema = {
  createComponent: Joi.object({
    courseId: Joi.number().required(),
    name: Joi.string().max(255).required(),
    weight: Joi.number().greater(0).max(100).required(),
    graded: Joi.boolean().default(false),
    // When graded is true, grade must be a real number (not null/absent).
    grade: Joi.number().min(0).max(100).allow(null).when('graded', {
      is: true,
      then: Joi.required().invalid(null),
    }),
    category: Joi.string().max(100).optional(),
  }),
  updateComponent: Joi.object({
    name: Joi.string().max(255).optional(),
    weight: Joi.number().greater(0).max(100).optional(),
    graded: Joi.boolean().optional(),
    grade: Joi.number().min(0).max(100).allow(null).when('graded', {
      is: true,
      then: Joi.required().invalid(null),
    }),
    category: Joi.string().max(100).optional(),
  }).min(1),
};

export const createComponent = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.createComponent.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { courseId, name, weight, graded, grade, category } = value;
  const userId = req.user?.userId;

  try {
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (courseResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    const result = await pool.query(
      'INSERT INTO grade_components (course_id, name, weight, graded, grade, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [courseId, name, weight, graded || false, grade ?? null, category || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Component creation error:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
};

export const getComponents = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT gc.* FROM grade_components gc
       JOIN courses c ON gc.course_id = c.id
       WHERE gc.course_id = $1 AND c.user_id = $2
       ORDER BY gc.id DESC`,
      [courseId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch components error:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
};

export const updateComponent = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.updateComponent.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { componentId } = req.params;
  const userId = req.user?.userId;

  try {
    const verify = await pool.query(
      `SELECT gc.* FROM grade_components gc
       JOIN courses c ON gc.course_id = c.id
       WHERE gc.id = $1 AND c.user_id = $2`,
      [componentId, userId]
    );

    if (verify.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to modify this component' });
    }

    const fields = Object.keys(value).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(value);

    const result = await pool.query(
      `UPDATE grade_components SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, componentId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
};

export const deleteComponent = async (req: AuthRequest, res: Response) => {
  const { componentId } = req.params;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `DELETE FROM grade_components WHERE id = $1 AND course_id IN
       (SELECT id FROM courses WHERE user_id = $2) RETURNING *`,
      [componentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this component' });
    }

    res.json({ message: 'Component deleted' });
  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
};
