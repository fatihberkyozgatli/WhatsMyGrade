import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { getAi, DEFAULT_MODEL, isAiConfigured } from '../services/ai';
import { parseScale, DEFAULT_GRADE_SCALE, GradeScale } from '../constants';
import Joi from 'joi';

const messageSchema = Joi.object({
  message: Joi.string().max(1000).required(),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().max(800).required(),
      })
    )
    .max(16)
    .default([]),
});

async function fetchSummary(courseId: string, userId: number) {
  const [courseRes, componentsRes, scaleRes] = await Promise.all([
    pool.query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]),
    pool.query('SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id', [courseId]),
    pool.query('SELECT scale FROM grade_scales WHERE course_id = $1', [courseId]),
  ]);

  if (courseRes.rows.length === 0) return null;

  const course = courseRes.rows[0];
  const components = componentsRes.rows;
  const scale: GradeScale =
    scaleRes.rows.length > 0 ? parseScale(scaleRes.rows[0].scale) : DEFAULT_GRADE_SCALE;

  let totalWeightedGrade = 0;
  let totalGradedWeight = 0;
  let totalRemainingWeight = 0;

  for (const comp of components) {
    const w = Number(comp.weight);
    if (comp.graded && comp.grade !== null) {
      totalWeightedGrade += (Number(comp.grade) * w) / 100;
      totalGradedWeight += w;
    } else {
      totalRemainingWeight += w;
    }
  }

  const currentGrade =
    totalGradedWeight > 0 ? totalWeightedGrade / (totalGradedWeight / 100) : null;

  return {
    courseName: course.name,
    semester: course.semester,
    currentGrade: currentGrade !== null ? Math.round(currentGrade * 100) / 100 : null,
    percentageGraded: totalGradedWeight,
    percentageRemaining: totalRemainingWeight,
    components: components.map((c) => ({
      name: c.name,
      weight: Number(c.weight),
      graded: c.graded,
      grade: c.grade !== null ? Number(c.grade) : null,
    })),
    scale,
  };
}

async function toolCalculateScenario(
  courseId: string,
  userId: number,
  hypotheticalScores: Record<string, number>
) {
  const [componentsRes, scaleRes] = await Promise.all([
    pool.query('SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id', [courseId]),
    pool.query('SELECT scale FROM grade_scales WHERE course_id = $1', [courseId]),
  ]);

  const components = componentsRes.rows;
  const scale: GradeScale =
    scaleRes.rows.length > 0 ? parseScale(scaleRes.rows[0].scale) : DEFAULT_GRADE_SCALE;
  const totalWeight = components.reduce((s: number, c: any) => s + Number(c.weight), 0);

  let coveredWeight = 0;
  let weightedSum = 0;

  for (const comp of components) {
    const w = Number(comp.weight);
    const nameLower = comp.name.toLowerCase();
    const matchKey = Object.keys(hypotheticalScores).find(
      (k) => k.toLowerCase() === nameLower
    );
    const score =
      matchKey !== undefined
        ? hypotheticalScores[matchKey]
        : comp.graded && comp.grade !== null
        ? Number(comp.grade)
        : null;

    if (score !== null) {
      weightedSum += (score * w) / 100;
      coveredWeight += w;
    }
  }

  const projectedGrade = coveredWeight > 0 ? weightedSum / (coveredWeight / 100) : null;

  let projectedLetter = 'N/A';
  if (projectedGrade !== null) {
    const entries = Object.entries(scale).sort((a, b) => b[1].min - a[1].min);
    for (const [letter, range] of entries) {
      if (projectedGrade >= range.min) {
        projectedLetter = letter;
        break;
      }
    }
  }

  return {
    projectedGrade: projectedGrade !== null ? Math.round(projectedGrade * 100) / 100 : null,
    projectedLetter,
    coveragePercent: totalWeight > 0 ? Math.round((coveredWeight / totalWeight) * 100) : 0,
  };
}

async function toolGetRequiredScore(
  courseId: string,
  userId: number,
  targetLetter: string
) {
  const [componentsRes, scaleRes] = await Promise.all([
    pool.query('SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id', [courseId]),
    pool.query('SELECT scale FROM grade_scales WHERE course_id = $1', [courseId]),
  ]);

  const components = componentsRes.rows;
  const scale: GradeScale =
    scaleRes.rows.length > 0 ? parseScale(scaleRes.rows[0].scale) : DEFAULT_GRADE_SCALE;
  const target = scale[targetLetter.toUpperCase()];

  if (!target) return { error: `Unknown letter grade: ${targetLetter}` };

  let weightedGrade = 0;
  let gradedWeight = 0;
  let remainingWeight = 0;

  for (const comp of components) {
    const w = Number(comp.weight);
    if (comp.graded && comp.grade !== null) {
      weightedGrade += (Number(comp.grade) * w) / 100;
      gradedWeight += w;
    } else {
      remainingWeight += w;
    }
  }

  const currentGrade = gradedWeight > 0 ? weightedGrade / (gradedWeight / 100) : 0;

  if (remainingWeight === 0) {
    return {
      targetLetter,
      targetMin: target.min,
      requiredAverage: null,
      status: currentGrade >= target.min ? 'already_secured' : 'no_longer_possible',
      currentGrade: Math.round(currentGrade * 100) / 100,
      remainingComponents: [],
    };
  }

  const requiredAverage =
    (target.min * 100 - currentGrade * gradedWeight) / remainingWeight;

  return {
    targetLetter,
    targetMin: target.min,
    requiredAverage: Math.round(requiredAverage * 100) / 100,
    status:
      requiredAverage > 100
        ? 'not_possible'
        : requiredAverage < 0
        ? 'already_secured'
        : 'achievable',
    currentGrade: Math.round(currentGrade * 100) / 100,
    remainingComponents: components
      .filter((c: any) => !(c.graded && c.grade !== null))
      .map((c: any) => ({ name: c.name, weight: Number(c.weight) })),
  };
}

async function toolCompareComponentImpact(courseId: string) {
  const componentsRes = await pool.query(
    'SELECT * FROM grade_components WHERE course_id = $1 ORDER BY weight DESC',
    [courseId]
  );

  const components = componentsRes.rows;
  const totalWeight = components.reduce((s: number, c: any) => s + Number(c.weight), 0);
  const ungraded = components.filter((c: any) => !(c.graded && c.grade !== null));

  return {
    components: ungraded.map((c: any) => ({
      name: c.name,
      weight: Number(c.weight),
      shareOfTotal: totalWeight > 0 ? Math.round((Number(c.weight) / totalWeight) * 100) : 0,
      gradeImpactPer10Points: Math.round((Number(c.weight) / 100) * 10 * 100) / 100,
    })),
  };
}

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'getCourseSummary',
      description:
        'Get the current grade, all components with weights and scores, and the grade scale for this course.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculateScenario',
      description:
        'Calculate the projected final grade if the student scores specific hypothetical values on named components.',
      parameters: {
        type: 'object',
        properties: {
          hypotheticalScores: {
            type: 'object',
            description:
              'Object mapping component name (exactly as it appears in the course) to a hypothetical score 0-100.',
            additionalProperties: { type: 'number' },
          },
        },
        required: ['hypotheticalScores'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getRequiredScore',
      description:
        'Calculate what average score the student needs on all remaining ungraded components to achieve a target letter grade.',
      parameters: {
        type: 'object',
        properties: {
          targetLetter: {
            type: 'string',
            description: 'The target letter grade.',
            enum: ['A', 'B', 'C', 'D'],
          },
        },
        required: ['targetLetter'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compareComponentImpact',
      description:
        'Compare remaining ungraded components by how much each one affects the final grade.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

export const chatWithCoach = async (req: AuthRequest, res: Response) => {
  if (!isAiConfigured()) {
    return res
      .status(503)
      .json({ error: 'Grade Coach is not available (AI is not configured).' });
  }

  const { courseId } = req.params;
  const userId = req.user!.userId;

  if (!/^\d+$/.test(courseId)) {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  const { error, value } = messageSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { message, history } = value;

  try {
    const summary = await fetchSummary(courseId, userId);
    if (!summary) {
      return res.status(403).json({ error: 'Not authorized to access this course' });
    }

    const componentList = summary.components
      .map(
        (c) =>
          `  - ${c.name} (${c.weight}%): ${
            c.graded && c.grade !== null ? `${c.grade}% scored` : 'ungraded'
          }`
      )
      .join('\n');

    const systemPrompt = `You are Grade Coach, an AI academic planning assistant built into WhatsMyGrade. You help students understand their grades and plan strategically.

You have live access to course data for "${summary.courseName}" (${summary.semester}).

Current snapshot:
- Current grade: ${summary.currentGrade !== null ? `${summary.currentGrade}%` : 'No grades yet'}
- Graded weight: ${summary.percentageGraded}% of total
- Remaining weight: ${summary.percentageRemaining}%
- Components:
${componentList}

Rules:
- Always call a tool for any grade calculation — never estimate from memory.
- Keep answers short, clear, and encouraging. 2–4 sentences for simple questions.
- Use plain English. When citing a number, be precise.
- If the student asks a what-if question, call calculateScenario.
- If they ask what they need for a grade, call getRequiredScore.
- If they ask what to focus on or their riskiest component, call compareComponentImpact.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const ai = getAi();
    let iterations = 0;

    while (iterations < 5) {
      iterations++;

      const response = await ai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];

      if (choice.finish_reason === 'stop' || !choice.message.tool_calls?.length) {
        return res.json({ reply: choice.message.content ?? '' });
      }

      messages.push(choice.message);

      for (const call of choice.message.tool_calls) {
        let result: unknown;
        try {
          const fn = (call as any).function;
          const args = JSON.parse(fn?.arguments || '{}');
          switch (fn?.name) {
            case 'getCourseSummary':
              result = summary;
              break;
            case 'calculateScenario':
              result = await toolCalculateScenario(courseId, userId, args.hypotheticalScores ?? {});
              break;
            case 'getRequiredScore':
              result = await toolGetRequiredScore(courseId, userId, args.targetLetter);
              break;
            case 'compareComponentImpact':
              result = await toolCompareComponentImpact(courseId);
              break;
            default:
              result = { error: 'Unknown tool' };
          }
        } catch (err) {
          result = { error: String(err) };
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return res.status(500).json({ error: 'Agent loop did not complete. Please try again.' });
  } catch (err) {
    console.error('Coach error:', err);
    res.status(502).json({ error: 'Failed to get a response from Grade Coach. Please try again.' });
  }
};
