-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
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

-- Grade Components Table
CREATE TABLE IF NOT EXISTS grade_components (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  weight DECIMAL(5, 2) NOT NULL,
  graded BOOLEAN DEFAULT FALSE,
  grade DECIMAL(5, 2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grade Scales Table
CREATE TABLE IF NOT EXISTS grade_scales (
  id SERIAL PRIMARY KEY,
  course_id INTEGER UNIQUE NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  scale JSONB DEFAULT '{"A": {"min": 90, "max": 100}, "B": {"min": 80, "max": 89.99}, "C": {"min": 70, "max": 79.99}, "D": {"min": 60, "max": 69.99}, "F": {"min": 0, "max": 59.99}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_components_course_id ON grade_components(course_id);
CREATE INDEX idx_scales_course_id ON grade_scales(course_id);
