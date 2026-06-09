import { describe, it, expect } from 'vitest';
import { computeResult, GradeComponentInput } from './gradeCalc';
import { DEFAULT_GRADE_SCALE, buildGradeScale, parseScale } from '../constants';

const comp = (
  weight: number | string,
  graded: boolean,
  grade: number | string | null
): GradeComponentInput => ({ weight, graded, grade });

describe('computeResult — no components', () => {
  it('returns nulls and a "no components" status for an empty list', () => {
    const result = computeResult([], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBeNull();
    expect(result.percentageGraded).toBe(0);
    expect(result.percentageRemaining).toBe(0);
    expect(result.projectedFinalGrade).toBeNull();
    expect(result.status).toBe('No components added');
    expect(result.weightWarning).toBe('');
  });

  it('asks the user to add components for every letter requirement', () => {
    const result = computeResult([], DEFAULT_GRADE_SCALE);

    expect(result.requiredByLetterGrade).toEqual({
      A: 'Add components to see requirements',
      B: 'Add components to see requirements',
      C: 'Add components to see requirements',
      D: 'Add components to see requirements',
      F: 'Add components to see requirements',
    });
  });
});

describe('computeResult — fully graded', () => {
  it('computes the current grade as the weighted average of graded components', () => {
    const result = computeResult([comp(50, true, 90), comp(50, true, 80)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBe(85);
    expect(result.percentageGraded).toBe(100);
    expect(result.percentageRemaining).toBe(0);
  });

  it('projects the final grade as the current grade when nothing remains', () => {
    const result = computeResult([comp(100, true, 88)], DEFAULT_GRADE_SCALE);

    expect(result.projectedFinalGrade).toBe(88);
  });

  it('marks letters at or below the current grade secured and higher ones impossible', () => {
    const result = computeResult([comp(100, true, 85)], DEFAULT_GRADE_SCALE);

    expect(result.requiredByLetterGrade).toEqual({
      A: 'No longer possible',
      B: 'Already secured',
      C: 'Already secured',
      D: 'Already secured',
      F: 'Already secured',
    });
  });
});

describe('computeResult — partially graded', () => {
  it('projects the maximum obtainable grade assuming 100 on remaining work', () => {
    const result = computeResult([comp(50, true, 80), comp(50, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBe(80);
    expect(result.percentageGraded).toBe(50);
    expect(result.percentageRemaining).toBe(50);
    expect(result.projectedFinalGrade).toBe(90);
  });

  it('computes the average required on remaining work for each letter', () => {
    const result = computeResult([comp(50, true, 80), comp(50, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.requiredByLetterGrade).toEqual({
      A: '100.00%',
      B: '80.00%',
      C: '60.00%',
      D: '40.00%',
      F: 'Already secured',
    });
  });

  it('reports "No longer possible" when the required average exceeds 100', () => {
    const result = computeResult([comp(50, true, 50), comp(50, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.requiredByLetterGrade.A).toBe('No longer possible');
  });

  it('reports "Already secured" when the required average is negative', () => {
    const result = computeResult([comp(50, true, 100), comp(50, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.requiredByLetterGrade.F).toBe('Already secured');
  });

  it('is "On Track" with required averages when components exist but none are graded', () => {
    const result = computeResult([comp(100, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBeNull();
    expect(result.status).toBe('On Track');
    expect(result.requiredByLetterGrade.A).toBe('90.00%');
  });
});

describe('computeResult — status thresholds', () => {
  it.each([
    [95, 'Excellent'],
    [85, 'Good'],
    [75, 'At Risk'],
    [65, 'Needs Improvement'],
  ])('labels a current grade of %d as "%s"', (grade, status) => {
    const result = computeResult([comp(100, true, grade)], DEFAULT_GRADE_SCALE);

    expect(result.status).toBe(status);
  });

  it('uses the boundary inclusively (90 is Excellent on the default scale)', () => {
    const result = computeResult([comp(100, true, 90)], DEFAULT_GRADE_SCALE);

    expect(result.status).toBe('Excellent');
  });

  it('derives status from the rounded grade so the badge matches the displayed value', () => {
    const result = computeResult([comp(100, true, 89.996)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBe(90);
    expect(result.status).toBe('Excellent');
  });
});

describe('computeResult — custom scale', () => {
  it('applies custom thresholds to status', () => {
    const scale = buildGradeScale({ A: 85, B: 75, C: 65, D: 55 });
    const result = computeResult([comp(100, true, 86)], scale);

    expect(result.status).toBe('Excellent');
  });

  it('applies custom thresholds to letter requirements', () => {
    const scale = buildGradeScale({ A: 85, B: 75, C: 65, D: 55 });
    const result = computeResult([comp(100, true, 86)], scale);

    expect(result.requiredByLetterGrade.A).toBe('Already secured');
  });
});

describe('computeResult — weight warning', () => {
  it('warns when the weights do not total 100', () => {
    const result = computeResult([comp(40, true, 90), comp(50, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.weightWarning).toBe('Warning: Component weights total 90.00%, expected 100%');
  });

  it('does not warn when the weights total 100', () => {
    const result = computeResult([comp(60, true, 90), comp(40, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.weightWarning).toBe('');
  });
});

describe('computeResult — rounding', () => {
  it('rounds the current grade to two decimals', () => {
    const result = computeResult([comp(100, true, 90.125)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBe(90.13);
  });

  it('rounds the projected grade to two decimals', () => {
    const result = computeResult([comp(1, true, 50), comp(2, false, null)], DEFAULT_GRADE_SCALE);

    expect(result.projectedFinalGrade).toBe(83.33);
  });
});

describe('computeResult — input handling', () => {
  it('accepts numeric strings for weight and grade (database rows)', () => {
    const result = computeResult(
      [comp('50', true, '80'), comp('50', false, null)],
      DEFAULT_GRADE_SCALE
    );

    expect(result.currentGrade).toBe(80);
  });

  it('treats a graded component with a null grade as ungraded', () => {
    const result = computeResult([comp(100, true, null)], DEFAULT_GRADE_SCALE);

    expect(result.currentGrade).toBeNull();
    expect(result.percentageRemaining).toBe(100);
    expect(result.status).toBe('On Track');
  });

  it('passes the original components through on the result', () => {
    const components = [comp(100, true, 90)];
    const result = computeResult(components, DEFAULT_GRADE_SCALE);

    expect(result.components).toBe(components);
  });
});

describe('buildGradeScale', () => {
  it('builds descending ranges from the given thresholds', () => {
    expect(buildGradeScale({ A: 90, B: 80, C: 70, D: 60 })).toEqual({
      A: { min: 90, max: 100 },
      B: { min: 80, max: 89.99 },
      C: { min: 70, max: 79.99 },
      D: { min: 60, max: 69.99 },
      F: { min: 0, max: 59.99 },
    });
  });

  it('defaults to 90/80/70/60 when thresholds are omitted', () => {
    expect(buildGradeScale({})).toEqual(buildGradeScale({ A: 90, B: 80, C: 70, D: 60 }));
  });
});

describe('parseScale', () => {
  it('parses a JSON string scale', () => {
    expect(parseScale(JSON.stringify(DEFAULT_GRADE_SCALE))).toEqual(DEFAULT_GRADE_SCALE);
  });

  it('returns an object scale unchanged', () => {
    expect(parseScale(DEFAULT_GRADE_SCALE)).toBe(DEFAULT_GRADE_SCALE);
  });
});
