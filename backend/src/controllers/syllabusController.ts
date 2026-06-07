import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { buildGradeScale } from '../constants';
import { getAi, DEFAULT_MODEL, isAiConfigured } from '../services/ai';
import Joi from 'joi';

const SYSTEM_PROMPT =
  'You extract structured course information from a university syllabus PDF. ' +
  'Only use information actually present in the document; never invent values. ' +
  'If a field is missing, return null (or an empty array for components). ' +
  'Write component names in Title Case (e.g. "Midterm", "Film Reviews", "Class Participation"), ' +
  'never all-caps or all-lowercase. ' +
  'Weights are percentages (numbers, e.g. 30 for "30%"). The grading scale uses only ' +
  'the base letters A, B, C, D as the minimum percentage for each. If the syllabus uses ' +
  '+/- grades (A-, B+, C-, etc.), collapse each letter family to its base letter and use ' +
  'the LOWEST percentage of that family (the minus-variant minimum). Example: given ' +
  'A- 90-93 and A 93-100, set A = 90 (where A- starts); likewise B = the minimum of B-, ' +
  'C = the minimum of C-, D = the minimum of D- (or D itself when there is no D-). ' +
  'Use "warnings" only for genuine ambiguities or interpretations you made (e.g. collapsing ' +
  '+/- grades, weights not summing to 100, unclear values). Keep each warning short and plain, ' +
  'and do not use em dashes. Do NOT warn that components or the grading scale are missing; the ' +
  'app detects and handles those itself.';

const USER_PROMPT =
  'Extract the course name, semester/term, the grade components with their weights, ' +
  'and the letter-grade percentage thresholds from this syllabus.';

const SYLLABUS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    course: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        semester: { type: ['string', 'null'] },
      },
      required: ['name', 'semester'],
    },
    components: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          weight: { type: 'number' },
        },
        required: ['name', 'weight'],
      },
    },
    gradingScale: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        A: { type: 'number' },
        B: { type: 'number' },
        C: { type: 'number' },
        D: { type: 'number' },
      },
      required: ['A', 'B', 'C', 'D'],
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['course', 'components', 'gradingScale', 'warnings'],
} as const;

export const parseSyllabus = async (req: AuthRequest, res: Response) => {
  if (!isAiConfigured()) {
    return res
      .status(503)
      .json({ error: 'Syllabus parsing is not available (AI is not configured).' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }
  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF files are accepted' });
  }

  try {
    const base64 = file.buffer.toString('base64');
    const ai = getAi();

    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
            {
              type: 'file',
              file: {
                filename: file.originalname || 'syllabus.pdf',
                file_data: `data:application/pdf;base64,${base64}`,
              },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'syllabus_extraction', strict: true, schema: SYLLABUS_SCHEMA },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'The AI returned an empty response' });
    }

    let draft: unknown;
    try {
      draft = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'The AI returned malformed data' });
    }

    res.json(draft);
  } catch (error) {
    console.error('Syllabus parse error:', error);
    res.status(502).json({
      error: 'Failed to parse the syllabus. Please try again or enter the course manually.',
    });
  }
};

const draftSchema = Joi.object({
  name: Joi.string().max(255).required(),
  semester: Joi.string().max(100).required(),
  components: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(255).required(),
        weight: Joi.number().greater(0).max(100).required(),
      })
    )
    .max(100)
    .required(),
  gradingScale: Joi.object({
    A: Joi.number().min(0).max(100).required(),
    B: Joi.number().min(0).less(Joi.ref('A')).required(),
    C: Joi.number().min(0).less(Joi.ref('B')).required(),
    D: Joi.number().min(0).less(Joi.ref('C')).required(),
  })
    .optional()
    .allow(null),
});

export const createCourseFromDraft = async (req: AuthRequest, res: Response) => {
  const { error, value } = draftSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, semester, components, gradingScale } = value;
  const userId = req.user?.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const courseResult = await client.query(
      'INSERT INTO courses (user_id, name, semester, professor, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, semester, null, null]
    );
    const course = courseResult.rows[0];

    if (gradingScale) {
      await client.query('INSERT INTO grade_scales (course_id, scale) VALUES ($1, $2)', [
        course.id,
        JSON.stringify(buildGradeScale(gradingScale)),
      ]);
    }

    for (const comp of components) {
      await client.query(
        'INSERT INTO grade_components (course_id, name, weight, graded, grade, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [course.id, comp.name, comp.weight, false, null, null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(course);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create-from-draft error:', err);
    res.status(500).json({ error: 'Failed to create course from draft' });
  } finally {
    client.release();
  }
};
