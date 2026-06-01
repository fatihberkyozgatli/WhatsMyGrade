import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware';

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

    const components = componentsResult.rows;

    const scaleResult = await pool.query(
      'SELECT scale FROM grade_scales WHERE course_id = $1',
      [courseId]
    );

    let scale = {
      A: { min: 90, max: 100 },
      B: { min: 80, max: 89.99 },
      C: { min: 70, max: 79.99 },
      D: { min: 60, max: 69.99 },
      F: { min: 0, max: 59.99 },
    };

    if (scaleResult.rows.length > 0) {
      const scaleData = scaleResult.rows[0].scale;
      scale = typeof scaleData === 'string' ? JSON.parse(scaleData) : scaleData;
    }

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
      projectedFinalGrade =
        (currentGrade * percentageGraded + 100 * totalRemainingWeight) / 100;
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
        const requiredAverage =
          (targetGrade * 100 - currentGrade! * percentageGraded) / totalRemainingWeight;

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

    res.json({
      currentGrade: currentGrade ? Math.round(currentGrade * 100) / 100 : null,
      percentageGraded,
      percentageRemaining,
      projectedFinalGrade: projectedFinalGrade ? Math.round(projectedFinalGrade * 100) / 100 : null,
      requiredByLetterGrade,
      status,
      components,
      weightWarning,
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate grades' });
  }
};
