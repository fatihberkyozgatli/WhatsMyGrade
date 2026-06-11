import { describe, it, expect } from 'vitest';
import {
  computeResult,
  computeRequiredForLetter,
  computeScenario,
  GradeComponentInput,
} from './gradeCalc';
import { DEFAULT_GRADE_SCALE, buildGradeScale, parseScale } from '../constants';

const comp = (
  weight: number | string,
  graded: boolean,
  grade: number | string | null
): GradeComponentInput => ({ weight, graded, grade });

const named = (
  name: string,
  weight: number | string,
  graded: boolean,
  grade: number | string | null
): GradeComponentInput => ({ name, weight, graded, grade });

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

describe('computeRequiredForLetter', () => {
  it('computes the required average on remaining work for the target letter', () => {
    const result = computeRequiredForLetter(
      [comp(50, true, 80), comp(50, false, null)],
      DEFAULT_GRADE_SCALE,
      'B'
    );

    expect(result).toMatchObject({
      targetLetter: 'B',
      targetMin: 80,
      requiredAverage: 80,
      status: 'achievable',
      currentGrade: 80,
    });
  });

  it('normalizes by the actual total weight when weights do not sum to 100', () => {
    const result = computeRequiredForLetter(
      [named('Essay', 40, true, 90), named('Final', 50, false, null)],
      DEFAULT_GRADE_SCALE,
      'A'
    );

    expect(result.requiredAverage).toBe(90);
    expect(result.status).toBe('achievable');
  });

  it('agrees with computeResult for every letter', () => {
    const components = [comp(30, true, 72), comp(30, true, 91), comp(40, false, null)];
    const engine = computeResult(components, DEFAULT_GRADE_SCALE);

    for (const letter of ['A', 'B', 'C', 'D', 'F']) {
      const r = computeRequiredForLetter(components, DEFAULT_GRADE_SCALE, letter);
      const expected = engine.requiredByLetterGrade[letter];
      if (expected === 'Already secured') {
        expect(r.status).toBe('already_secured');
      } else if (expected === 'No longer possible') {
        expect(r.status).toBe('not_possible');
      } else {
        expect(r.status).toBe('achievable');
        expect(`${r.requiredAverage!.toFixed(2)}%`).toBe(expected);
      }
    }
  });

  it('reports already_secured when the required average is negative', () => {
    const result = computeRequiredForLetter(
      [comp(50, true, 100), comp(50, false, null)],
      DEFAULT_GRADE_SCALE,
      'F'
    );

    expect(result.status).toBe('already_secured');
  });

  it('reports not_possible when the required average exceeds 100', () => {
    const result = computeRequiredForLetter(
      [comp(50, true, 50), comp(50, false, null)],
      DEFAULT_GRADE_SCALE,
      'A'
    );

    expect(result.status).toBe('not_possible');
  });

  it('handles a fully graded course as secured or not possible', () => {
    const components = [comp(100, true, 85)];

    expect(computeRequiredForLetter(components, DEFAULT_GRADE_SCALE, 'B').status).toBe(
      'already_secured'
    );
    expect(computeRequiredForLetter(components, DEFAULT_GRADE_SCALE, 'A').status).toBe(
      'not_possible'
    );
  });

  it('works before any grades exist', () => {
    const result = computeRequiredForLetter([comp(100, false, null)], DEFAULT_GRADE_SCALE, 'A');

    expect(result.requiredAverage).toBe(90);
    expect(result.status).toBe('achievable');
    expect(result.currentGrade).toBeNull();
  });

  it('rejects an unknown letter', () => {
    const result = computeRequiredForLetter([comp(100, false, null)], DEFAULT_GRADE_SCALE, 'Z');

    expect(result.error).toBeDefined();
  });

  it('lists the remaining ungraded components', () => {
    const result = computeRequiredForLetter(
      [named('Midterm', 40, true, 88), named('Final', 60, false, null)],
      DEFAULT_GRADE_SCALE,
      'A'
    );

    expect(result.remainingComponents).toEqual([{ name: 'Final', weight: 60 }]);
  });
});

describe('computeScenario', () => {
  const courseComponents = [
    named('Midterm', 50, true, 80),
    named('Final Exam', 50, false, null),
  ];

  it('projects the grade over covered weight, matching names case-insensitively', () => {
    const result = computeScenario(courseComponents, DEFAULT_GRADE_SCALE, {
      'final exam': 90,
    });

    expect(result.projectedGrade).toBe(85);
    expect(result.projectedLetter).toBe('B');
    expect(result.coveragePercent).toBe(100);
    expect(result.unmatchedNames).toEqual([]);
  });

  it('reports names that did not match any component instead of silently dropping them', () => {
    const result = computeScenario(courseComponents, DEFAULT_GRADE_SCALE, { Finol: 90 });

    expect(result.unmatchedNames).toEqual(['Finol']);
    expect(result.projectedGrade).toBe(80);
    expect(result.coveragePercent).toBe(50);
  });

  it('matches a partial name when it is unambiguous', () => {
    const result = computeScenario(courseComponents, DEFAULT_GRADE_SCALE, { final: 90 });

    expect(result.unmatchedNames).toEqual([]);
    expect(result.projectedGrade).toBe(85);
  });

  it('does not bind a nonexistent name onto a component it merely contains', () => {
    const result = computeScenario(
      [named('Quiz 1', 50, true, 80), named('Quiz 2', 50, false, null)],
      DEFAULT_GRADE_SCALE,
      { 'Quiz 10': 95 }
    );

    expect(result.unmatchedNames).toEqual(['Quiz 10']);
    expect(result.projectedGrade).toBe(80);
  });

  it('lets a hypothetical score override an existing grade', () => {
    const result = computeScenario(courseComponents, DEFAULT_GRADE_SCALE, {
      Midterm: 100,
      'Final Exam': 100,
    });

    expect(result.projectedGrade).toBe(100);
    expect(result.projectedLetter).toBe('A');
  });

  it('fills every ungraded component when allRemainingScore is given', () => {
    const result = computeScenario(
      [named('Midterm', 50, true, 80), named('Essay', 25, false, null), named('Final', 25, false, null)],
      DEFAULT_GRADE_SCALE,
      {},
      90
    );

    expect(result.projectedGrade).toBe(85);
    expect(result.coveragePercent).toBe(100);
  });

  it('returns no projection when nothing is graded or hypothesized', () => {
    const result = computeScenario([named('Final', 100, false, null)], DEFAULT_GRADE_SCALE, {});

    expect(result.projectedGrade).toBeNull();
    expect(result.projectedLetter).toBe('N/A');
    expect(result.coveragePercent).toBe(0);
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
