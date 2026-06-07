export interface Course {
  id: number;
  user_id: number;
  name: string;
  semester: string;
  professor?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeComponent {
  id: number;
  course_id: number;
  name: string;
  weight: number;
  graded: boolean;
  grade: number | null;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeRange {
  min: number;
  max: number;
}

export type GradeScale = Record<'A' | 'B' | 'C' | 'D' | 'F', GradeRange>;

export const DEFAULT_GRADE_SCALE: GradeScale = {
  A: { min: 90, max: 100 },
  B: { min: 80, max: 89.99 },
  C: { min: 70, max: 79.99 },
  D: { min: 60, max: 69.99 },
  F: { min: 0, max: 59.99 },
};

export interface GradeCalculationResult {
  currentGrade: number | null;
  percentageGraded: number;
  percentageRemaining: number;
  projectedFinalGrade: number | null;
  requiredByLetterGrade: {
    [key: string]: string;
  };
  status: string;
  components: GradeComponent[];
  weightWarning: string;
}
