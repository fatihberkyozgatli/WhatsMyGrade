import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { getAi, DEFAULT_MODEL, isAiConfigured } from '../services/ai';
import { resolveGradeEntry } from '../services/gradeEntry';
import Joi from 'joi';

const entrySchema = Joi.object({
  text: Joi.string().min(1).max(200).required(),
});

export const parseGradeEntry = async (req: AuthRequest, res: Response) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'Grade entry is not available (AI is not configured).' });
  }

  const { courseId } = req.params;
  const userId = req.user!.userId;

  if (!/^\d+$/.test(courseId)) {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  const { error, value } = entrySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const courseRes = await pool.query('SELECT id FROM courses WHERE id = $1 AND user_id = $2', [
      courseId,
      userId,
    ]);
    if (courseRes.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to access this course' });
    }

    const componentsRes = await pool.query(
      'SELECT id, name FROM grade_components WHERE course_id = $1 ORDER BY id',
      [courseId]
    );
    const components = componentsRes.rows as { id: number; name: string }[];
    if (components.length === 0) {
      return res.status(422).json({ error: 'Add a component first, then I can log a score for it.' });
    }

    const list = components.map((c) => `  ${c.id}: ${c.name}`).join('\n');
    const systemPrompt = `You turn a student's note about a grade into JSON for one of their course components.

Components (id: name):
${list}

Return only JSON in the form {"componentId": <id or null>, "score": <number 0-100 or null>}.
- componentId: the id of the component the note refers to, matched by name (case-insensitive, allow common short forms such as "midterm" -> "Midterm Exam"). Use null if there is no clear match.
- score: the numeric score mentioned, on a 0-100 scale. Use null if no score is given.`;

    const ai = getAi();
    const response = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: value.text },
      ],
      response_format: { type: 'json_object' },
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.choices[0].message.content ?? '{}');
    } catch {
      return res.status(422).json({ error: 'I could not read that. Try: "I got an 85 on my midterm".' });
    }

    const resolved = resolveGradeEntry(parsed as Record<string, unknown>, components);
    if ('error' in resolved) {
      return res.status(422).json(resolved);
    }

    return res.json(resolved);
  } catch (err) {
    console.error('Grade entry error:', err);
    res.status(502).json({ error: 'Failed to read that. Please try again.' });
  }
};
