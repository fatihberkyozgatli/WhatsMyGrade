# WhatsMyGrade Architecture (V1)

> This is a refreshed architecture document that reflects the application **as actually built**.
> The original design record is preserved in `SystArchV0.md`. Where the two differ, V1 is authoritative.

## Chosen Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Authentication:** JWT-based register/login
- **Scope:** Course-level grade tracking (no sub-components)

---

# 1. Project Overview

**WhatsMyGrade** is a full-stack web application that helps students track their grades across multiple courses.

Users create an account, add courses, define each course's grade components and weights, and see their current grade, projected maximum grade, and exactly what average they need on remaining work to reach each letter grade.

Tagline: *"What do I need to get?"*

---

# 2. High-Level Architecture

```text
User
 ↓
React Frontend (Vite, port 5173)
 ↓  axios + JWT
Express REST API (port 5001)
 ↓  pg pool
PostgreSQL Database
```

---

# 3. Implemented Features

- User registration, login, and logout
- JWT-protected routes and user-scoped data
- Add / view / delete courses
- Add / update (grade entry) / delete grade components
- Per-course grade scale stored at course creation (JSONB)
- Current grade, projected maximum grade, and required-average-per-letter calculation
- "Already secured" / "No longer possible" outcomes
- Status badges (Excellent / Good / At Risk / Needs Improvement)
- Weight-total warning when components don't sum to 100%
- Responsive UI with loading, empty, and error states

### Known gaps / planned (see `TODO.md`)
- No UI to **edit** the grade scale after course creation (GET/PUT endpoints exist; calculation reads the stored scale).
- `professor` and `notes` columns exist and are accepted by the API, but there is no UI to set or display them yet.
- `GET /api/auth/profile` exists but is not yet consumed by the frontend.

---

# 4. User Flow

```text
Register / Login
 ↓
Dashboard (all courses + current grade per course)
 ↓
Create a course (name, semester, grade scale)
 ↓
Open course → add grade components (name, weight)
 ↓
Enter grades as work is completed
 ↓
App recalculates current grade, projected max, and required averages
```

---

# 5. Frontend Architecture

```text
frontend/
├── index.html
├── vite.config.ts                # Vite config + /api dev proxy → :5001
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example                  # VITE_API_URL
└── src/
    ├── main.tsx                  # React entry point (imports styles.css)
    ├── App.tsx                   # Router + route guards
    ├── AuthContext.tsx           # Auth state, token expiry checks
    ├── api.ts                    # Axios client with JWT interceptor
    ├── types.ts                  # Shared TypeScript interfaces
    ├── styles.css                # Tailwind layers + component classes
    ├── components/
    │   ├── Header.tsx            # Top navigation
    │   ├── CourseCard.tsx        # Dashboard course card
    │   ├── FormInputs.tsx        # FormInput + FormTextArea
    │   ├── GradeCalculator.tsx   # Grade summary + per-letter table
    │   └── ConfirmModal.tsx      # Reusable confirmation dialog
    └── pages/
        ├── LandingPage.tsx       # Public landing page
        ├── LoginPage.tsx         # Login
        ├── RegisterPage.tsx      # Registration
        ├── DashboardPage.tsx     # All courses overview
        ├── AddCoursePage.tsx     # Create course + grade scale
        └── CourseDetailPage.tsx  # Course management + grade entry
```

Routing is guarded in `App.tsx`: unauthenticated users hitting `/dashboard`, `/add-course`, or `/course/:id` are redirected to `/login`; authenticated users hitting `/login` or `/register` are redirected to `/dashboard`.

---

# 6. Frontend Pages

**Landing** — value proposition, feature highlights, and login/signup (or "Go to Dashboard" when authenticated).

**Login** — email + password → stores JWT, redirects to dashboard.

**Register** — single `name`, email, password, confirm password → creates account, logs in, redirects to dashboard.

**Dashboard** — grid of course cards. Each card shows current grade, graded vs. ungraded weight, the highest still-achievable letter grade and the average needed for it, a status badge, and a delete action.

**Add Course** — course name, semester, and the letter-grade scale (minimum % for A/B/C/D; F is the remainder). Validates the scale is strictly descending.

**Course Detail** — course header, the `GradeCalculator` summary, and the component list. Components can be added, graded inline, toggled back to ungraded, and deleted (with a confirmation modal).

---

# 7. Backend Architecture

```text
backend/
├── Dockerfile
├── .env.example                          # PORT, DATABASE_URL, JWT_SECRET, NODE_ENV
├── tsconfig.json
├── package.json
└── src/
    ├── index.ts                          # Express app, CORS, JSON, route mounting
    ├── config.ts                         # Env loading (PORT defaults to 5001)
    ├── db.ts                             # pg connection pool
    ├── middleware.ts                     # JWT auth guard + token generation
    ├── controllers/
    │   ├── authController.ts             # register, login, getProfile
    │   ├── courseController.ts           # course CRUD (+ scale on create)
    │   ├── gradeComponentController.ts   # component CRUD
    │   ├── gradeScaleController.ts       # grade scale get/update
    │   └── gradeCalculationController.ts # grade calculation engine
    └── routes/
        ├── auth.ts
        ├── courses.ts
        ├── components.ts
        ├── gradeScale.ts
        └── calculate.ts
```

Request path: **Routes → Controllers → Database**. Validation lives in the controllers via Joi. There is no separate services layer — controllers hold the logic directly, which is sufficient for this scope.

---

# 8. Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,        -- bcrypt hash
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE grade_scales (
  id SERIAL PRIMARY KEY,
  course_id INTEGER UNIQUE NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  scale JSONB DEFAULT '{"A":{"min":90,"max":100},"B":{"min":80,"max":89.99},"C":{"min":70,"max":79.99},"D":{"min":60,"max":69.99},"F":{"min":0,"max":59.99}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Indexes exist on `courses(user_id)`, `grade_components(course_id)`, and `grade_scales(course_id)`.

---

# 9. Relationships

```text
users ─< courses ─< grade_components
                 └─< grade_scales (one scale per course; course_id is UNIQUE)
```

`ON DELETE CASCADE` means deleting a user removes their courses, and deleting a course removes its components and scale.

---

# 10. API Routes

All routes except register/login require a valid `Authorization: Bearer <token>` header.

```text
# Authentication
POST   /api/auth/register             # create account → { user, token }
POST   /api/auth/login                # login → { user, token }
GET    /api/auth/profile              # current user (protected)

# Courses
GET    /api/courses                   # list user's courses
POST   /api/courses                   # create course (+ optional grade scale)
GET    /api/courses/:courseId         # get one course
PUT    /api/courses/:courseId         # update course
DELETE /api/courses/:courseId         # delete course

# Grade Components
POST   /api/components                # add component
GET    /api/components/:courseId      # list components for a course
PUT    /api/components/:componentId   # update component (grade / graded / etc.)
DELETE /api/components/:componentId   # delete component

# Grade Scales
GET    /api/grade-scale/:courseId     # get scale (returns default if none)
PUT    /api/grade-scale/:courseId     # create/update scale

# Calculations
GET    /api/calculate                # batch calculation for all user's courses
GET    /api/calculate/:courseId      # full grade calculation for a course
```

Errors return `{ "error": "message" }` with an appropriate HTTP status.

---

# 11. Grade Calculation Logic

For each graded component the engine accumulates weighted points:

```text
earned_points    = Σ(grade × weight / 100)          # graded components only
graded_weight    = Σ(weight of graded components)
remaining_weight = Σ(weight of ungraded components)
total_weight     = graded_weight + remaining_weight

current_grade        = earned_points / (graded_weight / 100)
projected_max_grade  = (current_grade × graded_weight + 100 × remaining_weight) / total_weight
required_average     = (target_min × total_weight − current_grade × graded_weight) / remaining_weight
```

`projected_max_grade` ("Maximum Obtainable" in the UI) assumes 100% on all remaining work.

### Output rules (per letter grade)

- No components yet → `"Add components to see requirements"`
- No remaining weight → `"Already secured"` (if current ≥ target) or `"No longer possible"`
- `required_average > 100` → `"No longer possible"`
- `required_average < 0` → `"Already secured"`
- otherwise → e.g. `"87.50%"`

### Status

`Excellent` (≥ A min) · `Good` (≥ B min) · `At Risk` (≥ C min) · `Needs Improvement` (below C) · `No components added` (no weight yet).

### Calculation response shape

```json
{
  "currentGrade": 91.4,
  "percentageGraded": 65,
  "percentageRemaining": 35,
  "projectedFinalGrade": 97.05,
  "requiredByLetterGrade": { "A": "Already secured", "B": "...", "C": "...", "D": "...", "F": "..." },
  "status": "Excellent",
  "components": [ /* ... */ ],
  "weightWarning": ""
}
```

---

# 12. Validation Rules

Server-side validation uses Joi schemas inside the controllers.

- **User:** email valid & unique, password ≥ 6 chars, name required; passwords hashed with bcrypt (10 salt rounds).
- **Course:** name and semester required; ownership verified via `user_id`; `professor`/`notes` optional.
- **Component:** name required, weight > 0 and ≤ 100, grade 0–100 when graded (else `null`); ownership verified through the parent course.
- **Grade scale:** validated A > B > C > D ≥ 0 on the client at course creation; a default scale is returned if none exists.
- **Weight total:** the calculation returns a warning when component weights don't sum to 100% (it does not block).

---

# 13. Authentication Flow

```text
Login → backend verifies user + bcrypt-compares password
    → backend signs a JWT (fixed TTL: 7 days)
     → frontend stores the token in localStorage
     → axios interceptor attaches it to every request
     → backend middleware verifies the token on protected routes
     → AuthContext re-checks expiry on app load and window focus,
       logging the user out automatically once the token is stale
```

> Note: token lifetime is a fixed `7d` in `middleware.ts`.

---

# 14. Security Notes

- Passwords hashed with bcrypt; password hashes are never returned to the client.
- JWT secret read from `JWT_SECRET` in `.env`; startup fails fast if required env vars are missing, and middleware rejects invalid/missing tokens at request time.
- Every protected handler verifies course/component ownership before reading or mutating data.
- Database credentials come from environment variables.
- Use HTTPS in production.

---

# 15. Environment Variables

**Backend (`backend/.env`)**
```text
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/whatsmygrade
JWT_SECRET=your_secret_key
NODE_ENV=development
```

**Frontend (`frontend/.env`)**
```text
VITE_API_URL=http://localhost:5001/api
```

---

# 16. Structural Decisions

- **Unified axios client (`api.ts`)** — one place for the JWT interceptor and base URL.
- **React Context for auth** — no extra state library; also handles automatic logout on token expiry.
- **Shared `types.ts`** — all interfaces in one file at this scale.
- **Controllers hold logic (no services layer)** — Routes → Controllers → DB, with Joi validation in the controller.
- **JSONB grade scales** — the whole scale lives in one column, which keeps reads/writes atomic and leaves room for fully custom scales later.
- **Simplified column names** — `name`, `weight`, `graded`, `grade` instead of longer variants.

---

# 17. Project Structure

```text
WhatsMyGrade/
├── frontend/                 # React + TypeScript (Vite)
├── backend/                  # Node.js + Express + TypeScript
├── database/
│   ├── init.sql              # Full schema + indexes
│   └── README.md
├── docker-compose.yml        # Postgres + backend + frontend
├── setup.sh                  # Local setup helper
├── package.json              # Root scripts (concurrently)
├── README.md                 # Project overview
├── SystArchV0.md             # Original design record
├── SystArchV1.md             # This document (as-built)
└── TODO.md                   # Next-phase notes
```

---

# 18. Resume Description

Built **WhatsMyGrade**, a full-stack grade-planning app that lets students track course performance and calculate the average they need on remaining work to reach each letter grade. React + TypeScript frontend, Node.js/Express REST API, PostgreSQL with JWT-authenticated, user-scoped data, and a weighted grade-calculation engine.
