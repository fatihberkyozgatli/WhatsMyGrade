export interface GradeRange {
  min: number;
  max: number;
}

export type GradeScale = Record<string, GradeRange>;

export const DEFAULT_GRADE_SCALE: GradeScale = {
  A: { min: 90, max: 100 },
  B: { min: 80, max: 89.99 },
  C: { min: 70, max: 79.99 },
  D: { min: 60, max: 69.99 },
  F: { min: 0, max: 59.99 },
};
Object.values(DEFAULT_GRADE_SCALE).forEach(Object.freeze);
Object.freeze(DEFAULT_GRADE_SCALE);

export const parseScale = (scale: unknown): GradeScale =>
  typeof scale === 'string' ? JSON.parse(scale) : (scale as GradeScale);

export const buildGradeScale = (thresholds: {
  A?: number;
  B?: number;
  C?: number;
  D?: number;
}): GradeScale => {
  const A = thresholds.A ?? 90;
  const B = thresholds.B ?? 80;
  const C = thresholds.C ?? 70;
  const D = thresholds.D ?? 60;

  return {
    A: { min: A, max: 100 },
    B: { min: B, max: Math.max(A - 0.01, B) },
    C: { min: C, max: Math.max(B - 0.01, C) },
    D: { min: D, max: Math.max(C - 0.01, D) },
    F: { min: 0, max: Math.max(D - 0.01, 0) },
  };
};
