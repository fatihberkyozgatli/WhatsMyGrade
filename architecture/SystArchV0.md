# WhatsMyGrade Architecture

## Chosen Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** JWT-based login/register
- **Scope:** Course-level grade tracking only
- **No subcomponents for MVP**
- **Portfolio goal:** polished UI, deployed app, clean README, diagrams, and demo-ready project

---

# 1. Project Overview

**WhatsMyGrade** is a full-stack web application that helps students track their grades across multiple courses.

Users can create an account, add as many courses as they want, define each course’s grading components, customize the letter-grade scale for each course, and calculate what grades they need on remaining assignments to reach each final letter grade.

---

# 2. High-Level Architecture

```text
User
 ↓
React Frontend
 ↓
Express REST API
 ↓
PostgreSQL Database
```

---

# 3. Main Features
MVP Features
User registration
User login/logout
Protected dashboard
Add, edit, delete courses
Add, edit, delete grade components
Add separate grading scale for each course
Calculate current grade
Calculate needed average on remaining work for each letter grade
Show impossible/already-secured grade outcomes
Responsive frontend design
Portfolio-Level Features
Clean landing page
Modern dashboard
Course detail page
Input validation
Error handling
Loading states
Empty states
README with setup instructions
Architecture diagram
API documentation
Deployment link

---

# 4. User registers/logs in
 ↓
User lands on dashboard
 ↓
User creates a course
 ↓
User adds grading components
 ↓
User enters weights and grades
 ↓
User customizes the grade scale
 ↓
App calculates:
  - current grade
  - completed weight
  - remaining weight
  - needed average for each letter grade
 ↓
User updates grades throughout semester

---

# 5. Frontend Architecture
Actual Implementation
frontend/
├── src/
│   ├── api.ts                         # Unified Axios client with JWT interceptor
│   │
│   ├── components/
│   │   ├── Header.tsx                 # Navigation header
│   │   ├── CourseCard.tsx             # Reusable course display card
│   │   ├── FormInputs.tsx             # Reusable form inputs and textarea
│   │   └── GradeCalculator.tsx        # Grade calculation display
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx            # Public landing page
│   │   ├── LoginPage.tsx              # User login
│   │   ├── RegisterPage.tsx           # User registration
│   │   ├── DashboardPage.tsx          # All courses overview
│   │   ├── AddCoursePage.tsx          # Create new course
│   │   └── CourseDetailPage.tsx       # Full course management
│   │
│   ├── types.ts                       # All TypeScript interfaces
│   ├── AuthContext.tsx                # Authentication state management
│   ├── App.tsx                        # Main app with routing
│   ├── main.tsx                       # React entry point
│   ├── styles.css                     # Global Tailwind styles
│   │
│   ├── index.html                     # HTML template
│   ├── vite.config.ts                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── postcss.config.js              # PostCSS config
│   ├── tsconfig.json                  # TypeScript config
│   ├── package.json
│   └── .env.example

---

# 6. Frontend Pages
Landing Page

Purpose:

Explain what WhatsMyGrade does
Show value clearly
Encourage signup/login

Sections:

Hero section
Feature highlights
Example grade calculation
Call-to-action buttons
Login Page

Inputs:

Email
Password

Actions:

Submit login request
Store JWT
Redirect to dashboard
Register Page

Inputs:

First name
Last name
Email
Password
Confirm password

Actions:

Create account
Log user in or redirect to login
Dashboard Page

Displays:

All courses owned by the user
Current grade per course
Target status
Add course button

Course card example:

CS 3345 - Data Structures
Current Grade: 91.4%
Remaining: 35%
Status: A possible
Course Detail Page

Displays:

Course information
Grade components
Grade scale
Current grade summary
Needed grades table

Example:

To earn an A: Need 88.2% average on remaining work
To earn a B: Already secured
To earn a C: Already secured

---

# 7. Backend Architecture
Actual Implementation
backend/
├── src/
│   ├── config.ts                      # Configuration and environment loading
│   ├── db.ts                          # PostgreSQL connection pool
│   ├── middleware.ts                  # JWT authentication and token generation
│   │
│   ├── controllers/
│   │   ├── authController.ts          # Register, login, profile
│   │   ├── courseController.ts        # Course CRUD operations
│   │   ├── gradeComponentController.ts # Component management
│   │   ├── gradeScaleController.ts    # Grading scale CRUD
│   │   └── gradeCalculationController.ts # Grade calculations
│   │
│   ├── routes/
│   │   ├── auth.ts                    # Auth endpoints
│   │   ├── courses.ts                 # Course endpoints
│   │   ├── components.ts              # Component endpoints
│   │   ├── gradeScale.ts              # Grade scale endpoints
│   │   └── calculate.ts               # Calculation endpoints
│   │
│   ├── index.ts                       # Express server entry point
│   │
│   ├── Dockerfile                     # Docker containerization
│   ├── .env.example                   # Environment template
│   ├── package.json
│   ├── tsconfig.json                  # TypeScript config
│   └── .gitignore

---

# 8. Database Schema
Actual Implementation

users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

courses
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(100) NOT NULL,
    professor VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

grade_components
```sql
CREATE TABLE grade_components (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    graded BOOLEAN DEFAULT FALSE,
    grade DECIMAL(5,2),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

grade_scales
```sql
CREATE TABLE grade_scales (
    id SERIAL PRIMARY KEY,
    course_id INTEGER UNIQUE NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    scale JSONB DEFAULT '{"A": {"min": 90, "max": 100}, "B": {"min": 80, "max": 89.99}, "C": {"min": 70, "max": 79.99}, "D": {"min": 60, "max": 69.99}, "F": {"min": 0, "max": 59.99}}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Key Differences:
- Users: Single `name` field instead of separate first/last names
- Courses: Simplified column names (`name`, `semester`, `professor`, `notes`)
- Grade Components: `weight` instead of `weight_percentage`, `graded` instead of `is_graded`, `grade` instead of `grade_received`, added optional `category`
- Grade Scales: Uses JSONB for flexible grading scale storage instead of separate rows per letter grade

# 9. Relationships
users
  ↓ one-to-many
courses
  ↓ one-to-many
grade_components

courses
  ↓ one-to-many
grade_scales

Each user can have many courses.

Each course has:

Many grade components
Its own separate grading scale

# 10. API Routes
Actual Implementation

Authentication
```
POST   /api/auth/register           # Create account
POST   /api/auth/login              # Login user
GET    /api/auth/profile            # Get user profile (protected)
```

Courses
```
GET    /api/courses                 # Get all user courses (protected)
POST   /api/courses                 # Create course (protected)
GET    /api/courses/:courseId       # Get specific course (protected)
PUT    /api/courses/:courseId       # Update course (protected)
DELETE /api/courses/:courseId       # Delete course (protected)
```

Grade Components
```
POST   /api/components              # Add component (protected)
GET    /api/components/:courseId    # Get components for course (protected)
PUT    /api/components/:componentId # Update component (protected)
DELETE /api/components/:componentId # Delete component (protected)
```

Grade Scales
```
GET    /api/grade-scale/:courseId   # Get grading scale (protected)
PUT    /api/grade-scale/:courseId   # Update grading scale (protected)
```

Grade Calculations
```
GET    /api/calculate/:courseId     # Calculate all grades for course (protected)
```

Response Format: All successful requests return JSON. Errors return: `{ "error": "error message" }`

# 11. Grade Calculation Logic
Weighted points earned
earned_points = Σ(grade_received × weight_percentage / 100)

Only graded components are included.

Completed weight
completed_weight = Σ(weight_percentage of graded components)
Remaining weight
remaining_weight = 100 - completed_weight
Current grade on completed work
current_grade = earned_points / completed_weight × 100
Required average for a target grade
required_average = (target_min_percentage - earned_points) / remaining_weight × 100

# 12. Calculation Output Rules

For each letter grade:

If required average > 100
A is no longer mathematically possible.
If required average <= 0
You have already secured this grade.
If required average is between 0 and 100
You need an 87.5% average on remaining work to earn an A.
If no assignments remain
Your final grade is 91.2%, which is an A.

# 13. Validation Rules
Actual Implementation

All validation is performed server-side using Joi schemas in controllers.

User Validation
- Email must be unique
- Password minimum 6 characters
- Name is required
- Passwords are hashed with bcryptjs (10 salt rounds) before storing

Course Validation
- Course name is required
- Semester is required
- Course must belong to logged-in user (verified via user_id)
- Professor and notes are optional

Component Validation
- Component name is required
- Weight must be between 0 and 100
- Grade must be between 0 and 100 (when graded)
- Ungraded components have grade = null
- Component must belong to a course owned by logged-in user

Grade Scale Validation
- Must be valid JSON with letter grade keys
- Each grade has min and max properties (0-100)
- Minimum cannot exceed maximum
- Default scale provided if none exists

Weight Calculation
- App warns if total component weights ≠ 100%
- Warning message: "Warning: Component weights total XX%, expected 100%"

# 14. Authentication Flow
User enters email and password
 ↓
Backend checks if user exists
 ↓
Backend compares password with password_hash
 ↓
If valid, backend creates JWT
 ↓
Frontend stores JWT
 ↓
Frontend sends JWT with protected requests
 ↓
Backend verifies JWT
 ↓
Backend allows access only to that user's data

# 15. Security Requirements
Hash passwords with bcrypt
Use JWT for protected routes
Store JWT secret in .env
Validate every backend input
Check course ownership before returning or modifying data
Never return password hashes
Use HTTPS in production
Use environment variables for database credentials

# 16. Environment Variables
Backend .env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/whatsmygrade
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api

# 17. Development Milestones
Status: ✅ ALL COMPLETE

Milestone 1: Backend Setup ✅
- Express server initialized with CORS
- PostgreSQL connection pool configured
- Database schema created with all tables
- Auth routes with JWT middleware in place

Milestone 2: Course CRUD ✅
- Course controller with all operations
- Course routes for GET, POST, PUT, DELETE
- Route protection with authenticate middleware
- User ownership verified for all operations

Milestone 3: Grade Components ✅
- Grade component controller implemented
- Create, read, update, delete operations
- Weight and grade validation
- Proper authorization checks

Milestone 4: Grade Scale ✅
- Grade scale controller with JSONB storage
- Default scale provided on first access
- Custom scale storage per course
- Update functionality

Milestone 5: Grade Calculations ✅
- Complete calculation service implemented
- Current grade calculation with weighted average
- Required average calculation for each letter grade
- Status determination (Excellent, Good, At Risk, Needs Improvement)
- Weight validation with warnings
- "Already secured" and "No longer possible" logic

Milestone 6: Frontend Setup ✅
- React 18 with TypeScript
- Tailwind CSS configured
- Vite build tool
- React Router for navigation
- Authentication context

Milestone 7: Course UI ✅
- Landing page with features overview
- Dashboard with course cards
- Course detail page with full management
- Add course page
- Grade component display and editing
- Needed grades table

Milestone 8: Polish ✅
- Responsive mobile-first design
- Loading states with spinners
- Error state handling
- Empty state messages
- Comprehensive README
- API documentation
- Development guide
- Docker setup
# 18. Implementation Notes

## Frontend Structural Choices

1. **Unified API Client (`api.ts`)** instead of separate files
   - Simplified import statements
   - Single point for JWT interceptor configuration
   - Easier to maintain for current project size

2. **AuthContext** instead of custom hooks
   - Built-in React Context API
   - Cleaner state management for auth
   - No additional dependencies

3. **Inline Types in `types.ts`** instead of separate files
   - All interfaces in one location
   - Easier to find and modify types
   - Manageable for current project scope

## Backend Structural Choices

1. **Controllers with Direct Logic** instead of Services layer
   - Simplified architecture
   - Routes → Controllers → Database
   - Validation in controllers with Joi
   - Sufficient for MVP scope

2. **Middleware in Single File (`middleware.ts`)**
   - JWT generation and verification in one place
   - Clean separation from routes

## Database Structural Choices

1. **JSONB for Grade Scales** instead of separate rows
   - Flexibility for future custom scales
   - Easier to edit complete scale in one operation
   - Native PostgreSQL JSON support

2. **Simplified Column Names**
   - `name` instead of `first_name`/`last_name`/`course_name`/`component_name`
   - `weight` instead of `weight_percentage`
   - `graded` instead of `is_graded`
   - `grade` instead of `grade_received`
   - Cleaner, more intuitive naming

## Authentication

- JWT tokens expire after 30 days (configurable via JWT_EXPIRES_IN)
- Tokens stored in localStorage on frontend
- Automatic JWT attachment via axios interceptor
- Protected routes require valid token

## Error Handling

- All errors return consistent JSON format: `{ "error": "message" }`
- Frontend displays error messages to users
- Validation errors specific (e.g., "Email already registered")
- Server errors logged to console
# 18. Resume Description
Built WhatsMyGrade, a full-stack grade planning platform that allows students to track course performance, customize grading scales, and calculate required scores on remaining assignments. Developed a React and TypeScript frontend, Node.js/Express REST API, PostgreSQL database schema, JWT authentication, protected user-specific course data, and a grade calculation engine.

# 20. Final Project Structure
Actual Implementation

```
WhatsMyGrade/
├── frontend/                       # React + TypeScript frontend
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   ├── pages/                  # Page components
│   │   ├── api.ts                  # API client
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── AuthContext.tsx         # Auth state
│   │   ├── App.tsx                 # Main app
│   │   ├── main.tsx               # Entry point
│   │   └── styles.css              # Tailwind
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   └── .gitignore
│
├── backend/                        # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/            # Business logic
│   │   ├── routes/                 # API routes
│   │   ├── config.ts              # Configuration
│   │   ├── db.ts                  # Database connection
│   │   ├── middleware.ts          # Auth middleware
│   │   └── index.ts               # Server entry
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   └── .gitignore
│
├── database/                       # Database schema
│   ├── init.sql                    # Full schema
│   └── README.md
│
├── README.md                       # Project overview
├── QUICKSTART.md                   # Quick start guide
├── API_DOCS.md                     # Complete API docs
├── DEVELOPMENT.md                  # Developer guide
├── SystArchV0.md                   # This architecture document (updated)
├── docker-compose.yml              # Docker setup
├── .env.example                    # Environment template
├── .gitignore
├── setup.sh                        # Setup script
└── package.json                    # Root package.json
```