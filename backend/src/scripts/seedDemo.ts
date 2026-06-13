import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import pool from '../db';

const DEMO_EMAIL = 'demo';
const DEMO_PASSWORD = 'demo';
const DEMO_NAME = 'Demo Student';

interface DemoComponent {
  name: string;
  weight: number;
  category: string;
  grade: number | null;
}

interface DemoCourse {
  name: string;
  semester: string;
  professor: string;
  notes: string | null;
  components: DemoComponent[];
}

const DEMO_COURSES: DemoCourse[] = [
  {
    name: 'Calculus II',
    semester: 'Fall 2025',
    professor: 'Dr. Eleanor Hughes',
    notes: 'Focus on integration techniques and series before the finals push.',
    components: [
      { name: 'Homework', weight: 15, category: 'Homework', grade: 92 },
      { name: 'Quizzes', weight: 10, category: 'Quizzes', grade: 88 },
      { name: 'Midterm 1', weight: 25, category: 'Exam', grade: 84 },
      { name: 'Midterm 2', weight: 25, category: 'Exam', grade: null },
      { name: 'Final Exam', weight: 25, category: 'Exam', grade: null },
    ],
  },
  {
    name: 'Intro to Computer Science',
    semester: 'Fall 2025',
    professor: 'Prof. Marcus Lee',
    notes: 'Weekly labs and three projects. Final is cumulative.',
    components: [
      { name: 'Labs', weight: 20, category: 'Labs', grade: 95 },
      { name: 'Projects', weight: 30, category: 'Projects', grade: 90 },
      { name: 'Midterm', weight: 20, category: 'Exam', grade: 86 },
      { name: 'Final Project', weight: 30, category: 'Projects', grade: null },
    ],
  },
  {
    name: 'English Composition',
    semester: 'Fall 2025',
    professor: 'Dr. Priya Anand',
    notes: 'Research paper draft due before the presentation.',
    components: [
      { name: 'Essays', weight: 40, category: 'Writing', grade: 91 },
      { name: 'Participation', weight: 10, category: 'Participation', grade: 96 },
      { name: 'Research Paper', weight: 30, category: 'Writing', grade: null },
      { name: 'Presentation', weight: 20, category: 'Presentation', grade: null },
    ],
  },
];

async function upsertDemoUser(client: PoolClient): Promise<number> {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const result = await client.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
     RETURNING id`,
    [DEMO_EMAIL, hashedPassword, DEMO_NAME]
  );
  return result.rows[0].id;
}

async function insertCourses(client: PoolClient, userId: number): Promise<void> {
  for (const course of DEMO_COURSES) {
    const courseResult = await client.query(
      'INSERT INTO courses (user_id, name, semester, professor, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, course.name, course.semester, course.professor, course.notes]
    );
    const courseId = courseResult.rows[0].id;

    await client.query('INSERT INTO grade_scales (course_id) VALUES ($1)', [courseId]);

    for (const c of course.components) {
      await client.query(
        'INSERT INTO grade_components (course_id, name, weight, graded, grade, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, c.name, c.weight, c.grade !== null, c.grade, c.category]
      );
    }
  }
}

export async function seedDemo({ force }: { force: boolean }): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = await upsertDemoUser(client);

    const existing = await client.query(
      'SELECT COUNT(*)::int AS count FROM courses WHERE user_id = $1',
      [userId]
    );
    const courseCount: number = existing.rows[0].count;

    if (!force && courseCount > 0) {
      await client.query('COMMIT');
      console.log(`Demo account already has ${courseCount} course(s); leaving as-is.`);
      return;
    }

    await client.query('DELETE FROM courses WHERE user_id = $1', [userId]);
    await insertCourses(client, userId);

    await client.query('COMMIT');
    console.log(`Demo account seeded with ${DEMO_COURSES.length} course(s).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDemo({ force: true })
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Demo seed failed:', error);
      pool.end().finally(() => process.exit(1));
    });
}
