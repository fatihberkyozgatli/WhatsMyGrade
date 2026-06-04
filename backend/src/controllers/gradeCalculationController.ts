import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';
import { DEFAULT_GRADE_SCALE, parseScale, GradeScale } from '../constants';

const computeResult = (components: any[], scale: GradeScale) => {
  let totalWeightedGrade = 0;
  let totalGradedWeight = 0;
  let totalRemainingWeight = 0;

  components.forEach((comp) => {
    const weight = parseFloat(comp.weight);
    const grade = parseFloat(comp.grade);

    if (comp.graded && comp.grade !== null) {
      totalWeightedGrade += (grade * weight) / 100;
      totalGradedWeight += weight;
    } else {
      totalRemainingWeight += weight;
    }
  });

  const currentGrade = totalGradedWeight > 0 ? totalWeightedGrade / (totalGradedWeight / 100) : null;
  const percentageGraded = totalGradedWeight;
  const percentageRemaining = totalRemainingWeight;
  const totalWeight = percentageGraded + percentageRemaining;

  let projectedFinalGrade = null;
  if (totalRemainingWeight > 0 && currentGrade !== null) {
    // Normalize by totalWeight (not 100) so the projection stays meaningful when
    // component weights don't sum to 100. Reduces to the old formula when they do.
    projectedFinalGrade = (currentGrade * percentageGraded + 100 * totalRemainingWeight) / totalWeight;
  } else if (percentageRemaining === 0 && totalWeight > 0) {
    projectedFinalGrade = currentGrade;
  }

  const requiredByLetterGrade: { [key: string]: string } = {};

  Object.entries(scale).forEach(([letter, range]) => {
    const targetGrade = range.min;

    if (totalWeight === 0) {
      requiredByLetterGrade[letter] = 'Add components to see requirements';
    } else if (percentageRemaining === 0) {
      if (currentGrade !== null && currentGrade >= targetGrade) {
        requiredByLetterGrade[letter] = 'Already secured';
      } else {
        requiredByLetterGrade[letter] = 'No longer possible';
      }
    } else {
      // currentGrade can be null when nothing is graded yet (percentageGraded is
      // then 0, so this term is 0); use ?? 0 instead of a null-coercion assertion.
      const gradedAvg = currentGrade ?? 0;
      const requiredAverage =
        (targetGrade * totalWeight - gradedAvg * percentageGraded) / totalRemainingWeight;

      if (requiredAverage > 100) {
        requiredByLetterGrade[letter] = 'No longer possible';
      } else if (requiredAverage < 0) {
        requiredByLetterGrade[letter] = 'Already secured';
      } else {
        requiredByLetterGrade[letter] = `${requiredAverage.toFixed(2)}%`;
      }
    }
  });

  let status = 'On Track';
  if (totalWeight === 0) {
    status = 'No components added';
  } else if (currentGrade !== null) {
    if (currentGrade >= scale.A.min) {
      status = 'Excellent';
    } else if (currentGrade >= scale.B.min) {
      status = 'Good';
    } else if (currentGrade >= scale.C.min) {
      status = 'At Risk';
    } else {
      status = 'Needs Improvement';
    }
  }

  let weightWarning = '';
  if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
    weightWarning = `Warning: Component weights total ${totalWeight.toFixed(2)}%, expected 100%`;
  }

  return {
    currentGrade: currentGrade !== null ? Math.round(currentGrade * 100) / 100 : null,
    percentageGraded,
    percentageRemaining,
    projectedFinalGrade: projectedFinalGrade !== null ? Math.round(projectedFinalGrade * 100) / 100 : null,
    requiredByLetterGrade,
    status,
    components,
    weightWarning,
  };
};

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
        // A malformed scale row shouldn't 500 the course page; fall back to default.
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
        // A single malformed scale row shouldn't break the whole dashboard;
        // fall back to the default scale for this course.
        console.error(`Failed to parse grade scale for course ${row.course_id}, using default:`, parseError);
      }
    });

    const results: { [key: number]: ReturnType<typeof computeResult> } = {};
    courseIds.forEach((id) => {
      try {
        const scale = scaleByCourse.get(id) || DEFAULT_GRADE_SCALE;
        results[id] = computeResult(componentsByCourse.get(id) || [], scale);
      } catch (courseError) {
        // Isolate per-course failures so one bad course doesn't 500 the batch.
        console.error(`Failed to compute grades for course ${id}, skipping:`, courseError);
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate grades' });
  }
};
