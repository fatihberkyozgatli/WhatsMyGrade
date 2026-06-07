import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { buildGradeScale } from '../constants';
import Joi from 'joi';

const schema = {
  createCourse: Joi.object({
    name: Joi.string().max(255).required(),
    semester: Joi.string().max(100).required(),
    professor: Joi.string().max(255).optional(),
    notes: Joi.string().max(10000).optional(),
    gradingScale: Joi.object({
      A: Joi.number().min(0).max(100).required(),
      B: Joi.number().min(0).less(Joi.ref('A')).required(),
      C: Joi.number().min(0).less(Joi.ref('B')).required(),
      D: Joi.number().min(0).less(Joi.ref('C')).required(),
      F: Joi.number().min(0).max(100).optional(),
    }).optional(),
  }),
  updateCourse: Joi.object({
    name: Joi.string().max(255).optional(),
    semester: Joi.string().max(100).optional(),
    professor: Joi.string().max(255).optional(),
    notes: Joi.string().max(10000).optional(),
  }).min(1),
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.createCourse.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, semester, professor, notes, gradingScale } = value;
  const userId = req.user?.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO courses (user_id, name, semester, professor, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, semester, professor || null, notes || null]
    );
    const course = result.rows[0];

    if (gradingScale) {
      await client.query(
        'INSERT INTO grade_scales (course_id, scale) VALUES ($1, $2)',
        [course.id, JSON.stringify(buildGradeScale(gradingScale))]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(course);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Course creation error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  } finally {
    client.release();
  }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query('SELECT * FROM courses WHERE user_id = $1 ORDER BY id DESC', [
      userId,
    ]);

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
      [courseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.updateCourse.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const verify = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (verify.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const fields = Object.keys(value).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(value);
    values.push(courseId);
    values.push(userId);

    const paramCount = fields.length;
    const result = await pool.query(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING *',
      [courseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
