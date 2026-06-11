import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { getAi, DEFAULT_MODEL, isAiConfigured } from '../services/ai';
import { parseScale, DEFAULT_GRADE_SCALE, GradeScale } from '../constants';
import { computeResult, computeRequiredForLetter, computeScenario } from '../services/gradeCalc';
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
  const [courseRes, { components, scale }] = await Promise.all([
    pool.query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]),
    fetchComponentsAndScale(courseId),
  ]);

  if (courseRes.rows.length === 0) return null;

  const course = courseRes.rows[0];
  const result = computeResult(components, scale);

  return {
    courseName: course.name,
    semester: course.semester,
    currentGrade: result.currentGrade,
    percentageGraded: result.percentageGraded,
    percentageRemaining: result.percentageRemaining,
    maximumObtainable: result.projectedFinalGrade,
    weightWarning: result.weightWarning,
    components: components.map((c) => ({
      name: c.name,
      weight: Number(c.weight),
      graded: c.graded,
      grade: c.grade !== null ? Number(c.grade) : null,
    })),
    scale,
  };
}

async function fetchComponentsAndScale(courseId: string) {
  const [componentsRes, scaleRes] = await Promise.all([
    pool.query('SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id', [courseId]),
    pool.query('SELECT scale FROM grade_scales WHERE course_id = $1', [courseId]),
  ]);
  const scale: GradeScale =
    scaleRes.rows.length > 0 ? parseScale(scaleRes.rows[0].scale) : DEFAULT_GRADE_SCALE;
  return { components: componentsRes.rows, scale };
}

async function toolCalculateScenario(
  courseId: string,
  hypotheticalScores: Record<string, number>,
  allRemainingScore?: number
) {
  const { components, scale } = await fetchComponentsAndScale(courseId);
  return computeScenario(components, scale, hypotheticalScores, allRemainingScore);
}

async function toolGetRequiredScore(courseId: string, targetLetter: string) {
  const { components, scale } = await fetchComponentsAndScale(courseId);
  return computeRequiredForLetter(components, scale, targetLetter);
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

async function verifyCourseOwnership(courseId: string, userId: number) {
  const res = await pool.query('SELECT id FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
  return res.rows.length > 0;
}

async function toolAddComponents(
  courseId: string,
  userId: number,
  items: { name?: unknown; weight?: unknown }[]
) {
  if (!(await verifyCourseOwnership(courseId, userId))) {
    return { error: 'Not authorized to modify this course' };
  }
  if (!Array.isArray(items) || items.length === 0) return { error: 'No components provided' };

  const existingRes = await pool.query('SELECT name FROM grade_components WHERE course_id = $1', [courseId]);
  const existing = new Set(existingRes.rows.map((r) => String(r.name).toLowerCase()));

  const added: { name: string; weight: number }[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const weight = Number(item?.weight);
    if (!name || !Number.isFinite(weight) || weight <= 0 || weight > 100) {
      return { error: 'Each component needs a name and a weight between 0 and 100.' };
    }
    if (existing.has(name.toLowerCase())) {
      skipped.push(name);
      continue;
    }
    const inserted = await pool.query(
      'INSERT INTO grade_components (course_id, name, weight, graded, grade) VALUES ($1, $2, $3, false, null) RETURNING name, weight',
      [courseId, name, weight]
    );
    existing.add(name.toLowerCase());
    added.push({ name: inserted.rows[0].name, weight: Number(inserted.rows[0].weight) });
  }

  return { added, skipped };
}

async function toolUpdateComponents(
  courseId: string,
  userId: number,
  updates: { name?: unknown; weight?: unknown; newName?: unknown }[]
) {
  if (!(await verifyCourseOwnership(courseId, userId))) {
    return { error: 'Not authorized to modify this course' };
  }
  if (!Array.isArray(updates) || updates.length === 0) return { error: 'No updates provided' };

  const updated: string[] = [];
  const notFound: string[] = [];
  for (const u of updates) {
    const name = typeof u?.name === 'string' ? u.name.trim() : '';
    if (!name) return { error: 'Each update needs the component name.' };

    const matches = await pool.query(
      'SELECT id FROM grade_components WHERE course_id = $1 AND LOWER(name) = LOWER($2)',
      [courseId, name]
    );
    if (matches.rows.length === 0) {
      notFound.push(name);
      continue;
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    if (u.weight !== undefined && u.weight !== null) {
      const weight = Number(u.weight);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
        return { error: `Weight for ${name} must be between 0 and 100.` };
      }
      sets.push(`weight = $${sets.length + 1}`);
      vals.push(weight);
    }
    if (typeof u.newName === 'string' && u.newName.trim()) {
      sets.push(`name = $${sets.length + 1}`);
      vals.push(u.newName.trim());
    }
    if (sets.length === 0) continue;

    for (const row of matches.rows) {
      await pool.query(
        `UPDATE grade_components SET ${sets.join(', ')} WHERE id = $${sets.length + 1} AND course_id = $${sets.length + 2}`,
        [...vals, row.id, courseId]
      );
    }
    updated.push(name);
  }

  return { updated, notFound };
}

async function toolRemoveComponents(courseId: string, userId: number, names: unknown[]) {
  if (!(await verifyCourseOwnership(courseId, userId))) {
    return { error: 'Not authorized to modify this course' };
  }
  if (!Array.isArray(names) || names.length === 0) return { error: 'No components specified' };

  const removed: string[] = [];
  const notFound: string[] = [];
  for (const raw of names) {
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) continue;
    const del = await pool.query(
      'DELETE FROM grade_components WHERE course_id = $1 AND LOWER(name) = LOWER($2) RETURNING name',
      [courseId, name]
    );
    if (del.rows.length > 0) removed.push(name);
    else notFound.push(name);
  }

  return { removed, notFound };
}

async function toolSetGrades(
  courseId: string,
  userId: number,
  grades: { name?: unknown; score?: unknown }[]
) {
  if (!(await verifyCourseOwnership(courseId, userId))) {
    return { error: 'Not authorized to modify this course' };
  }
  if (!Array.isArray(grades) || grades.length === 0) return { error: 'No grades provided' };

  const updated: { name: string; score: number }[] = [];
  const notFound: string[] = [];
  for (const g of grades) {
    const name = typeof g?.name === 'string' ? g.name.trim() : '';
    const score = Number(g?.score);
    if (!name) return { error: 'Each grade needs the component name.' };
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return { error: `Score for ${name} must be between 0 and 100.` };
    }
    const upd = await pool.query(
      'UPDATE grade_components SET graded = true, grade = $1 WHERE course_id = $2 AND LOWER(name) = LOWER($3) RETURNING name',
      [score, courseId, name]
    );
    if (upd.rows.length > 0) updated.push({ name, score });
    else notFound.push(name);
  }

  return { updated, notFound };
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
        'Calculate the projected grade if the student scores specific hypothetical values on named components. The projection covers graded components plus the hypothetical ones; coveragePercent tells how much of the course it covers. Any names that did not match a component are returned in unmatchedNames — if that happens, retry with the exact names from the course summary.',
      parameters: {
        type: 'object',
        properties: {
          hypotheticalScores: {
            type: 'object',
            description:
              'Object mapping component name (exactly as it appears in the course) to a hypothetical score 0-100.',
            additionalProperties: { type: 'number' },
          },
          allRemainingScore: {
            type: 'number',
            description:
              'Optional. Apply this score to every remaining ungraded component (e.g. "what if I get 80 on everything left"). Individual hypotheticalScores override it.',
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
  {
    type: 'function' as const,
    function: {
      name: 'addComponents',
      description:
        'Create one or more grade components for this course. Only call this when the student clearly asks you to add or set up components. Each component needs a name and a weight percentage.',
      parameters: {
        type: 'object',
        properties: {
          components: {
            type: 'array',
            description: 'The components to create.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Component name, e.g. "Midterm Exam".' },
                weight: { type: 'number', description: 'Weight as a percentage from 0 to 100.' },
              },
              required: ['name', 'weight'],
            },
          },
        },
        required: ['components'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateComponents',
      description:
        "Change an existing component's weight and/or rename it. Match components by their current name.",
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Current component name to update.' },
                weight: { type: 'number', description: 'New weight 0-100 (optional).' },
                newName: { type: 'string', description: 'New name for the component (optional).' },
              },
              required: ['name'],
            },
          },
        },
        required: ['updates'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'removeComponents',
      description: 'Delete one or more components from this course, matched by name.',
      parameters: {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Component names to delete.',
          },
        },
        required: ['names'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'setGrades',
      description: 'Record or change the score on one or more components, matched by name.',
      parameters: {
        type: 'object',
        properties: {
          grades: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Component name.' },
                score: { type: 'number', description: 'Score from 0 to 100.' },
              },
              required: ['name', 'score'],
            },
          },
        },
        required: ['grades'],
      },
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
${componentList}${summary.weightWarning ? `\n- Note: ${summary.weightWarning}. Calculations normalize by the actual total.` : ''}

Rules:
- Always call a tool for any grade calculation — never estimate from memory, and never do the arithmetic yourself.
- Report the numbers a tool returns exactly as given; do not round further or recompute them.
- After you add, update, remove, or grade components, the snapshot above is outdated — call getCourseSummary if you need current numbers.
- For "what if I get X on everything left" questions, call calculateScenario with allRemainingScore instead of listing components.
- When calculateScenario returns unmatchedNames, retry using the exact component names from the snapshot before answering.
- Keep answers short, clear, and encouraging. 2–4 sentences for simple questions.
- Use plain English. When citing a number, be precise.
- If the student asks a what-if question, call calculateScenario.
- If they ask what they need for a grade, call getRequiredScore.
- If they ask what to focus on or their riskiest component, call compareComponentImpact.
- To add or set up components, call addComponents (it skips names that already exist).
- To change a component's weight or rename it, call updateComponents.
- To delete components, call removeComponents.
- To record or change a score on a component, call setGrades.
- Never say you changed course data unless a tool call actually succeeded. The component list above is your source of truth for what currently exists — do not add duplicates.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const ai = getAi();
    let iterations = 0;
    let dataChanged = false;

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
        return res.json({ reply: choice.message.content ?? '', dataChanged });
      }

      messages.push(choice.message);

      for (const call of choice.message.tool_calls) {
        let result: unknown;
        try {
          const fn = (call as any).function;
          const args = JSON.parse(fn?.arguments || '{}');
          switch (fn?.name) {
            case 'getCourseSummary':
              result = (await fetchSummary(courseId, userId)) ?? { error: 'Course not found' };
              break;
            case 'calculateScenario':
              result = await toolCalculateScenario(
                courseId,
                args.hypotheticalScores ?? {},
                typeof args.allRemainingScore === 'number' ? args.allRemainingScore : undefined
              );
              break;
            case 'getRequiredScore':
              result = await toolGetRequiredScore(courseId, args.targetLetter);
              break;
            case 'compareComponentImpact':
              result = await toolCompareComponentImpact(courseId);
              break;
            case 'addComponents':
              result = await toolAddComponents(courseId, userId, args.components ?? []);
              if (!(result as { error?: string }).error) dataChanged = true;
              break;
            case 'updateComponents':
              result = await toolUpdateComponents(courseId, userId, args.updates ?? []);
              if (!(result as { error?: string }).error) dataChanged = true;
              break;
            case 'removeComponents':
              result = await toolRemoveComponents(courseId, userId, args.names ?? []);
              if (!(result as { error?: string }).error) dataChanged = true;
              break;
            case 'setGrades':
              result = await toolSetGrades(courseId, userId, args.grades ?? []);
              if (!(result as { error?: string }).error) dataChanged = true;
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
