import { describe, it, expect } from 'vitest';
import { resolveGradeEntry } from './gradeEntry';

const components = [
  { id: 1, name: 'Final Exam' },
  { id: 2, name: 'Midterm Exam' },
];

describe('resolveGradeEntry', () => {
  it('resolves a matched component id and score', () => {
    expect(resolveGradeEntry({ componentId: 2, score: 85 }, components)).toEqual({
      componentId: 2,
      componentName: 'Midterm Exam',
      score: 85,
    });
  });

  it('coerces numeric strings from the model', () => {
    expect(resolveGradeEntry({ componentId: '1', score: '92.5' }, components)).toEqual({
      componentId: 1,
      componentName: 'Final Exam',
      score: 92.5,
    });
  });

  it('rounds the score to two decimals', () => {
    const result = resolveGradeEntry({ componentId: 1, score: 88.888 }, components);
    expect(result).toEqual({ componentId: 1, componentName: 'Final Exam', score: 88.89 });
  });

  it('errors when the component id is not in the course', () => {
    expect(resolveGradeEntry({ componentId: 99, score: 80 }, components)).toEqual({
      error: "I couldn't match that to a component in this course.",
    });
  });

  it('errors when no component was identified', () => {
    expect(resolveGradeEntry({ componentId: null, score: 80 }, components)).toHaveProperty('error');
  });

  it('errors when no score was identified', () => {
    expect(resolveGradeEntry({ componentId: 2, score: null }, components)).toHaveProperty('error');
  });

  it('errors when the score is out of range', () => {
    expect(resolveGradeEntry({ componentId: 2, score: 150 }, components)).toHaveProperty('error');
    expect(resolveGradeEntry({ componentId: 2, score: -5 }, components)).toHaveProperty('error');
  });

  it('does not treat a null score as zero', () => {
    expect(resolveGradeEntry({ componentId: 2, score: null }, components)).not.toHaveProperty('componentName');
  });
});
