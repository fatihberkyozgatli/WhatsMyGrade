export interface User {
  id: number;
  email: string;
  name: string;
}

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

export interface GradeScale {
  [key: string]: {
    min: number;
    max: number;
  };
}

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

export interface AuthResponse {
  user: User;
  token: string;
}
