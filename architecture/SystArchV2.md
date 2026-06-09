# WhatsMyGrade Architecture (V2)

> This document reflects the application **as currently built**, including all features and components.
> The original design record is preserved in `SystArchV0.md`. 
> V1 is superseded by this V2 document, which documents the Syllabus/AI feature and additional UI components.

## Chosen Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Backend Services:** External service integrations (e.g., AI-based syllabus parsing)
- **Database:** PostgreSQL
- **Authentication:** JWT-based register/login
- **Scope:** Course-level grade tracking with syllabus parsing and scenario planning

---

# 1. Project Overview

**WhatsMyGrade** is a full-stack web application that helps students track their grades across multiple courses and plan their academic outcomes.

Users create an account, add courses, define each course's grade components and weights, and see their current grade, projected maximum grade, and exactly what average they need on remaining work to reach each letter grade. Additionally, users can upload course syllabi for AI-assisted extraction of grade components and weights, and use scenario planning to visualize different grade outcomes.

Tagline: *"What do I need to get?"*

---

# 2. High-Level Architecture

```text
User
 ↓
React Frontend (Vite, port 5173)
 ├─→ Course Detail View (grade entry, scenario planning, charts)
 ├─→ Syllabus Upload (file upload + AI parsing)
 ↓  axios + JWT
Express REST API (port 5001)
 ├─→ Routes → Controllers → Services/Database
 ├─→ Syllabus controller → AI service (external)
 ↓  pg pool
PostgreSQL Database
```

---

# 3. Implemented Features

**Core Features:**
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

**Advanced Features:**
- **Syllabus Upload & AI Parsing** — upload PDF/image syllabi; AI service extracts grade components and weights automatically
- **Grade Scale Editing** — UI to edit letter-grade thresholds after course creation (not just at creation time)
- **Scenario Modeling** — "what-if" calculator; temporarily adjust component grades/weights to see outcome
- **Grade Visualization** — charts showing grade distribution, component weight breakdown, and projected outcomes
- **Professor & Notes** — store and display professor name and course notes

### Known gaps / planned (see `TODO.md`)
- Fine-tuning of AI parsing accuracy for various syllabus formats
- Export grade data (CSV/PDF)
- Multi-user course sharing / collaborative features

---

# 4. User Flow

```text
Register / Login
 ↓
Dashboard (all courses + current grade per course)
 ├─→ Create a course (name, semester, grade scale)
 │    ↓
 │    [Optional] Upload Syllabus → AI parses components + weights
 │    ↓
 │
 └─→ Open course → add/edit grade components (name, weight)
      ↓
      Edit grade scale (letter thresholds)
      ↓
      Enter grades as work is completed
      ↓
      View Grade Calculator (current, projected, required per letter)
      ↓
      [Optional] Use Scenario Modal to simulate different grades
      ↓
      View Grade Charts (weight distribution, projections)
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
    ├── useTheme.ts               # Theme/dark mode hook
    ├── styles.css                # Tailwind layers + component classes
    ├── vite-env.d.ts             # Vite environment type definitions
    ├── components/
    │   ├── Header.tsx            # Top navigation
    │   ├── Footer.tsx            # Footer component
    │   ├── CourseCard.tsx        # Dashboard course card
    │   ├── FormInputs.tsx        # FormInput + FormTextArea
    │   ├── GradeCalculator.tsx   # Grade summary + per-letter table
    │   ├── GradeCharts.tsx       # Visualizations (weight distribution, grade projections)
    │   ├── AddCourseButton.tsx   # Floating/sticky button to add course
    │   ├── AddCourseChoiceModal.tsx # Modal: Create course vs Upload syllabus
    │   ├── EditScaleModal.tsx    # Modal to edit letter-grade scale post-creation
    │   ├── ScenarioModal.tsx     # "What-if" calculator modal
    │   ├── ConfirmModal.tsx      # Reusable confirmation dialog
    │   ├── RotatingText.tsx      # Animated rotating text component (hero section)
    │   └── icons.tsx             # SVG icon components
    └── pages/
        ├── LandingPage.tsx       # Public landing page (hero, features, CTA)
        ├── LoginPage.tsx         # Login
        ├── RegisterPage.tsx      # Registration
        ├── DashboardPage.tsx     # All courses overview
        ├── AddCoursePage.tsx     # Create course + grade scale
        ├── CourseDetailPage.tsx  # Course management + grade entry + charts
        └── UploadSyllabusPage.tsx # Syllabus file upload + AI parsing progress
```

**Routing is guarded in `App.tsx`:**
- Unauthenticated users hitting `/dashboard`, `/add-course`, `/upload-syllabus`, or `/course/:id` are redirected to `/login`
- Authenticated users hitting `/login` or `/register` are redirected to `/dashboard`

---

# 6. Frontend Pages

**Landing** — value proposition, feature highlights (including syllabus upload & scenario planning), and login/signup (or "Go to Dashboard" when authenticated). Includes rotating text animation.

**Login** — email + password → stores JWT, redirects to dashboard.

**Register** — single `name`, email, password, confirm password → creates account, logs in, redirects to dashboard.

**Dashboard** — grid of course cards via `AddCourseButton`. Each card shows current grade, graded vs. ungraded weight, the highest still-achievable letter grade and the average needed for it, a status badge, and a delete action. `AddCourseChoiceModal` offers two paths: manual course creation or syllabus upload.

**Add Course** — course name, semester, professor (optional), notes (optional), and the letter-grade scale (minimum % for A/B/C/D; F is the remainder). Validates the scale is strictly descending.

**Upload Syllabus** — file uploader (PDF/image) with AI parsing progress indicator. Once parsed, auto-populates grade components and suggests weights. User reviews and finalizes before saving the course.

**Course Detail** — course header (with professor/notes if provided), `GradeCharts` summary, the `GradeCalculator` detailed view, component list, and action buttons. 
- Components can be added, graded inline, toggled back to ungraded, and deleted (with confirmation).
- `EditScaleModal` button allows post-creation adjustment of letter-grade thresholds.
- `ScenarioModal` button opens a "what-if" calculator to temporarily adjust grades/weights and see outcomes.

---

# 7. Frontend Components

**Layout & Navigation:**
- `Header.tsx` — top navigation bar with user menu and logout
- `Footer.tsx` — footer with links and copyright

**Forms & Inputs:**
- `FormInputs.tsx` — reusable `FormInput` (text/email/password) and `FormTextArea` components with labels, error states, and validation feedback
- `AddCourseButton.tsx` — prominent button (floating or sticky) to trigger course creation workflow

**Modals:**
- `AddCourseChoiceModal.tsx` — presents two options: (1) Create course manually, (2) Upload syllabus for AI parsing
- `EditScaleModal.tsx` — post-creation editing of grade scale thresholds; validates strictly descending order
- `ScenarioModal.tsx` — "what-if" calculator; adjust component grades/weights and see real-time recalculation
- `ConfirmModal.tsx` — reusable confirmation dialog for destructive actions (delete course, delete component, etc.)

**Grade Display & Analysis:**
- `CourseCard.tsx` — dashboard card showing course name, current grade, weight breakdown (graded % / ungraded %), highest achievable letter and required average, status badge
- `GradeCalculator.tsx` — detailed grade summary: current grade, percentage graded, percentage remaining, projected final grade, required average for each letter grade, and status badge
- `GradeCharts.tsx` — visualizations: pie/bar charts for component weight distribution, projected grade distribution across letter thresholds, and scenario outcomes

**Utilities:**
- `RotatingText.tsx` — animated rotating text component for hero section
- `icons.tsx` — collection of SVG icon components (plus, minus, check, x, etc.)

---

# 8. Backend Architecture

```text
backend/
├── Dockerfile
├── .env.example                          # PORT, DATABASE_URL, JWT_SECRET, NODE_ENV, AI_SERVICE_URL
├── tsconfig.json
├── package.json
└── src/
    ├── index.ts                          # Express app, CORS, JSON, multipart, route mounting
    ├── config.ts                         # Env loading (PORT defaults to 5001)
    ├── db.ts                             # pg connection pool
    ├── middleware.ts                     # JWT auth guard + token generation
    ├── controllers/
    │   ├── authController.ts             # register, login, getProfile
    │   ├── courseController.ts           # course CRUD (+ scale on create)
    │   ├── gradeComponentController.ts   # component CRUD
    │   ├── gradeScaleController.ts       # grade scale get/update (edit post-creation)
    │   ├── gradeCalculationController.ts # grade calculation engine
    │   └── syllabusController.ts         # syllabus upload + AI parsing + component extraction
    ├── services/
    │   └── ai.ts                         # AI service client (syllabus parsing, component extraction)
    └── routes/
        ├── auth.ts                       # /api/auth/*
        ├── courses.ts                    # /api/courses/*
        ├── components.ts                 # /api/components/*
        ├── gradeScale.ts                 # /api/grade-scale/*
        ├── calculate.ts                  # /api/calculate/*
        └── syllabus.ts                   # /api/syllabus/*
```

**Request path:** 
- Core operations: **Routes → Controllers → Database**
- Syllabus operations: **Routes → Controllers → Services (AI) → Database**

**Validation:** lives in the controllers via Joi.

**Services layer:** `ai.ts` encapsulates calls to an external AI service for parsing syllabi and extracting grade components.

---

# 9. Database Schema

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
  professor VARCHAR(255),                -- optional professor name
  notes TEXT,                            -- optional course notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grade_components (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  graded BOOLEAN DEFAULT FALSE,
  grade DECIMAL(5,2),                    -- NULL until graded
  category VARCHAR(100),                 -- optional: "exam", "assignment", "project", etc.
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

CREATE TABLE syllabus_uploads (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,                -- path to uploaded file
  parsing_status VARCHAR(50) DEFAULT 'pending',  -- pending | processing | completed | failed
  extracted_components JSONB,             -- AI-extracted grade components
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:** `courses(user_id)`, `grade_components(course_id)`, `grade_scales(course_id)`, `syllabus_uploads(course_id)`.

---

# 10. Relationships

```text
users ─< courses ─< grade_components
                 ├─< grade_scales (one scale per course; course_id is UNIQUE)
                 └─< syllabus_uploads (multiple uploads per course allowed)
```

`ON DELETE CASCADE` means deleting a user removes their courses, and deleting a course removes its components, scales, and syllabus uploads.

---

# 11. API Routes

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
PUT    /api/courses/:courseId         # update course (name, semester, professor, notes)
DELETE /api/courses/:courseId         # delete course

# Grade Components
POST   /api/components                # add component
GET    /api/components/:courseId      # list components for a course
PUT    /api/components/:componentId   # update component (grade / graded / weight / name / category)
DELETE /api/components/:componentId   # delete component

# Grade Scales
GET    /api/grade-scale/:courseId     # get scale (returns default if none)
PUT    /api/grade-scale/:courseId     # create/update scale (post-creation editing)

# Calculations
GET    /api/calculate                 # batch calculation for all user's courses
GET    /api/calculate/:courseId       # full grade calculation for a course
POST   /api/calculate/scenario        # scenario/what-if calculation with temporary adjustments

# Syllabus
POST   /api/syllabus/upload           # upload syllabus file (PDF/image) → { uploadId, status }
GET    /api/syllabus/:uploadId        # get syllabus upload status + extracted components
POST   /api/syllabus/:uploadId/confirm # confirm extracted components → auto-create grade components
DELETE /api/syllabus/:uploadId        # delete syllabus upload
```

**Errors return** `{ "error": "message" }` **with an appropriate HTTP status.**

---

# 12. Grade Calculation Logic

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

### Scenario Calculation

The scenario endpoint accepts temporary grade/weight overrides and returns a "what-if" calculation:

```json
POST /api/calculate/scenario
{
  "courseId": 1,
  "adjustments": {
    "componentId_1": { "grade": 95 },
    "componentId_2": { "weight": 15, "grade": 85 }
  }
}
```

Response includes the same fields as a standard calculation but reflecting the adjusted values (without persisting changes).

---

# 13. Syllabus Parsing & AI Integration

**Upload Flow:**
1. User selects PDF/image from `UploadSyllabusPage`
2. Frontend sends `multipart/form-data` to `POST /api/syllabus/upload`
3. Backend validates file type/size, stores file temporarily, triggers AI service
4. AI service (external) parses syllabus, extracts grade components, weights, and categories
5. Backend stores extracted data in `syllabus_uploads` table with `parsing_status = 'completed'`
6. Frontend polls `/api/syllabus/:uploadId` to check status
7. Once complete, user reviews and confirms components
8. `POST /api/syllabus/:uploadId/confirm` auto-creates grade components + components in the course

**AI Service Integration (`services/ai.ts`):**
- Calls external AI API with syllabus file/text
- Parses response for: component names, weights, categories (exam, homework, project, etc.)
- Returns structured JSON array of components
- Handles errors gracefully (parsing failures return user-friendly message)

**Example extracted components:**
```json
[
  { "name": "Midterm Exam", "weight": 25, "category": "exam" },
  { "name": "Final Exam", "weight": 35, "category": "exam" },
  { "name": "Homework Assignments", "weight": 20, "category": "assignment" },
  { "name": "Class Project", "weight": 20, "category": "project" }
]
```

---

# 14. Validation Rules

Server-side validation uses Joi schemas inside the controllers.

- **User:** email valid & unique, password ≥ 6 chars, name required; passwords hashed with bcrypt (10 salt rounds).
- **Course:** name and semester required; ownership verified via `user_id`; `professor`/`notes` optional.
- **Component:** name required, weight > 0 and ≤ 100, grade 0–100 when graded (else `null`), category optional; ownership verified through the parent course.
- **Grade scale:** validated A > B > C > D ≥ 0; can be edited post-creation; a default scale is returned if none exists.
- **Weight total:** the calculation returns a warning when component weights don't sum to 100% (it does not block).
- **Syllabus upload:** file type restricted to PDF/image (`.pdf`, `.jpg`, `.jpeg`, `.png`); file size max 10MB.

---

# 15. Authentication Flow

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

# 16. Security Notes

- Passwords hashed with bcrypt; password hashes are never returned to the client.
- JWT secret read from `JWT_SECRET` in `.env`; startup fails fast if required env vars are missing, and middleware rejects invalid/missing tokens at request time.
- Every protected handler verifies course/component ownership before reading or mutating data.
- Syllabus file uploads validated for type and size; stored outside the web root.
- Database credentials come from environment variables.
- Use HTTPS in production.
- Rate limiting configured (300 requests per 15 minutes per IP).

---

# 17. Environment Variables

**Backend (`backend/.env`)**
```text
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/whatsmygrade
JWT_SECRET=your_secret_key
NODE_ENV=development
AI_SERVICE_URL=https://api.example.com/parse-syllabus
AI_SERVICE_KEY=your_ai_api_key
```

**Frontend (`frontend/.env`)**
```text
VITE_API_URL=http://localhost:5001/api
```

---

# 18. Structural Decisions

- **Unified axios client (`api.ts`)** — one place for the JWT interceptor and base URL.
- **React Context for auth** — no extra state library; also handles automatic logout on token expiry.
- **Shared `types.ts`** — all interfaces in one file at this scale.
- **Services layer** — `ai.ts` abstracts external API calls; decouples controllers from third-party dependencies.
- **Controllers hold logic + validation** — Routes → Controllers (Joi validation) → Services/Database.
- **JSONB grade scales & extracted components** — atomic reads/writes, room for custom scales and flexible parsing results.
- **Syllabus upload table** — tracks upload history, parsing status, and extracted data separately from grade components (for audit trail and retry logic).
- **Scenario calculation** — temporary in-memory adjustments without database mutations.

---

# 19. Project Structure

```text
WhatsMyGrade/
├── frontend/                 # React + TypeScript (Vite)
├── backend/                  # Node.js + Express + TypeScript
├── database/
│   ├── init.sql              # Full schema + indexes (includes syllabus_uploads table)
│   └── README.md
├── docker-compose.yml        # Postgres + backend + frontend
├── setup.sh                  # Local setup helper
├── package.json              # Root scripts (concurrently)
├── README.md                 # Project overview
├── SystArchV0.md             # Original design record
├── SystArchV1.md             # Previous version (as-built at that time)
├── SystArchV2.md             # This document (current)
└── TODO.md                   # Next-phase notes
```

---

# 20. Key Differences from V1

| Feature | V1 | V2 |
|---------|----|----|
| Syllabus upload & AI parsing | ❌ Not documented | ✅ Full feature with AI service integration |
| Grade scale editing post-creation | ❌ API exists, no UI | ✅ UI + documented in EditScaleModal |
| Scenario/what-if calculator | ❌ Not documented | ✅ Full feature with ScenarioModal + endpoint |
| Grade charts/visualization | ❌ Not documented | ✅ GradeCharts component + visualizations |
| Services layer | ❌ None noted | ✅ ai.ts service for external integrations |
| Frontend components inventory | ❌ Incomplete | ✅ All components documented (AddCourseButton, Footer, GradeCharts, icons, RotatingText, etc.) |
| Professor & notes fields | ❌ Noted as not used | ✅ Documented and integrated in UI |
| Syllabus upload table | ❌ N/A | ✅ New table for tracking uploads + status |

---

# 21. Resume Description

Built **WhatsMyGrade**, a full-stack grade-planning app that lets students track course performance, calculate required averages per letter grade, upload and parse course syllabi using AI, and model "what-if" scenarios. React + TypeScript frontend with responsive charts and modals, Node.js/Express REST API with services layer, PostgreSQL with JWT-authenticated user-scoped data, and a weighted grade-calculation engine with scenario support.

---

# 22. Future Enhancements

- Fine-tune AI parsing for varied syllabus formats and edge cases
- Export grade data to CSV/PDF
- Multi-user course sharing and collaborative grade tracking
- Integration with institutional grade systems (Canvas, Blackboard, etc.)
- Mobile app (React Native)
- Historical grade analysis and trends
- Predictive analytics (estimate final grade based on early performance)
