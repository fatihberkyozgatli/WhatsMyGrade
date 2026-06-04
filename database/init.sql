CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  semester VARCHAR(100) NOT NULL,
  professor VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_components (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  weight DECIMAL(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  graded BOOLEAN DEFAULT FALSE,
  grade DECIMAL(5, 2) CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100)),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_scales (
  id SERIAL PRIMARY KEY,
  course_id INTEGER UNIQUE NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  scale JSONB DEFAULT '{"A": {"min": 90, "max": 100}, "B": {"min": 80, "max": 89.99}, "C": {"min": 70, "max": 79.99}, "D": {"min": 60, "max": 69.99}, "F": {"min": 0, "max": 59.99}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_components_course_id ON grade_components(course_id);
CREATE INDEX IF NOT EXISTS idx_scales_course_id ON grade_scales(course_id);

-- Keep updated_at current on every UPDATE (it otherwise stays equal to created_at).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS courses_set_updated_at ON courses;
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS components_set_updated_at ON grade_components;
CREATE TRIGGER components_set_updated_at BEFORE UPDATE ON grade_components
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS scales_set_updated_at ON grade_scales;
CREATE TRIGGER scales_set_updated_at BEFORE UPDATE ON grade_scales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
