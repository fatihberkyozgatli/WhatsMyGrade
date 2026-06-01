# WhatsMyGrade Database

PostgreSQL schema for WhatsMyGrade application.

## Setup

Initialize database:
`psql -U username -d database_name -f init.sql`

## Tables

users - User accounts with email and hashed passwords
courses - Course records with user ownership
grade_components - Grade items within courses with weights
grade_scales - Custom grading scales per course

## Schema Details

users: id (pk), email (unique), password (hashed), name, created_at, updated_at
courses: id (pk), user_id (fk), name, semester, professor, notes, created_at, updated_at
grade_components: id (pk), course_id (fk), name, weight, graded, grade, category, created_at, updated_at
grade_scales: id (pk), course_id (fk), scale (JSONB), created_at, updated_at
