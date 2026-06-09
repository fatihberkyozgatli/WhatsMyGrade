# WhatsMyGrade Architecture (V3)

> This document reflects the application as currently built. It supersedes V2.
> The original design record is in `SystArchV0.md`, and `SystArchV1.md` and `SystArchV2.md` are kept for history.
> V3 corrects two things V2 described but the code never had (a `syllabus_uploads` table and a `/api/calculate/scenario` endpoint), and adds everything built since: the AI Grade Coach with write tools, natural language grade entry, session hardening, the grade engine extraction with tests, and the deployment setup.

## Chosen stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router.
- Backend: Node, Express, TypeScript.
- Database: PostgreSQL (pg pool).
- AI: OpenAI, model `gpt-4o`, behind a shared `services/ai.ts`.
- Authentication: JWT register and login, bcrypt password hashing.
- Tests: Vitest.

---

# 1. Project overview

WhatsMyGrade helps students track grades across courses and plan outcomes. A user creates an account, adds courses, defines each course's grade components and weights, and sees the current grade, the maximum still reachable, and the exact average needed on remaining work for every letter grade.

On top of that core, three AI features sit on a shared OpenAI client:

- A Grade Coach chat that reads the live course and can both answer planning questions and edit the course (add, rename, reweight, remove components, and log grades).
- A syllabus parser that turns an uploaded PDF into a reviewable draft of components and weights.
- Natural language grade entry that turns a sentence like "I got an 85 on my midterm" into a confirmed grade.

Tagline: "What do I need to get?"

---

# 2. High level architecture

```text
User
 |
React frontend (Vite, port 5173)
 |  axios + JWT in localStorage
Express REST API (port 5001)
 |  routes -> controllers -> services / pg pool
 |  AI controllers (coach, syllabus, grade entry) -> services/ai.ts -> OpenAI
PostgreSQL
```

The frontend is a single page app. The backend is a stateless REST API: every request carries the JWT, every protected handler verifies ownership, and the AI features call OpenAI through one shared client.

---

# 3. Implemented features

Core:
- Register, login, logout, JWT protected routes, user scoped data.
- Add, view, update, delete courses.
- Add, grade, ungrade, rename, reweight, delete grade components.
- A custom letter scale per course, stored as JSONB, editable after creation.
- Grade engine: current grade, maximum obtainable, required average per letter, "Already secured" and "No longer possible" outcomes, a standing badge, and a weight total warning when components do not sum to 100.
- Scenario planning (a frontend only what if calculator).

AI:
- Grade Coach: a tool calling agent that reads the course and can also write to it.
- Syllabus parser: PDF to a reviewable draft, then a transactional create.
- Natural language grade entry: sentence to a previewed, confirmed grade.

Experience:
- Auth hardening: 8 hour token lifetime, server validation on load, a proactive expiry logout, and a 30 minute idle auto logout with a warning dialog.
- Dark mode, loading skeletons, toasts, a context aware help menu, terms and privacy modals, and a mobile friendly layout.

---

# 4. User flow

```text
Register or Login
 |
Dashboard (every course with its current grade)
 |- Add a course manually (name, semester, optional professor and notes, letter scale)
 |- Or upload a syllabus -> AI extracts a draft -> review and edit -> create the course
 |
Open a course
 |- Add components, enter grades inline, or use the "Log a grade" box in plain English
 |- Edit the grading scale
 |- Open Grade Coach to ask questions or have it set up and update the course for you
 |- Run a scenario to test hypothetical scores
 |- Watch the projection, required scores, and status update live
```

---

# 5. Frontend architecture

```text
frontend/
|-- index.html                    Google Fonts, theme bootstrap script
|-- vite.config.ts
|-- vercel.json                   SPA rewrite for client routing
|-- tailwind.config.js, postcss.config.js
|-- .env.example                  VITE_API_URL
`-- src/
    |-- main.tsx                  React entry, imports styles.css
    |-- App.tsx                   Router, route guards, app shell, SessionTimeout mount
    |-- AuthContext.tsx           Token state, load validation, expiry timer, focus and storage rechecks
    |-- ToastContext.tsx          Toast provider and portal
    |-- api.ts                    Axios client with the JWT interceptor and 401 handling
    |-- types.ts                  Shared interfaces and the default grade scale
    |-- useTheme.ts               Dark mode hook
    |-- styles.css                Tailwind layers, component classes, number input cleanup
    |-- utils/formatters.ts       Grade and percent formatting
    |-- components/
    |   |-- Header.tsx, Footer.tsx, AuthLayout.tsx
    |   |-- HelpMenu.tsx          Context aware help popover (route based content)
    |   |-- ThemeToggle.tsx, SessionTimeout.tsx
    |   |-- CourseCard.tsx, GradeCalculator.tsx, GradeCharts.tsx
    |   |-- GradeCoach.tsx        Right side AI drawer
    |   |-- QuickGradeEntry.tsx   Natural language "Log a grade" box
    |   |-- ScenarioModal.tsx, EditScaleModal.tsx, ConfirmModal.tsx
    |   |-- AddCourseButton.tsx, AddCourseChoiceModal.tsx
    |   |-- LegalModal.tsx, TermsModal.tsx, PrivacyModal.tsx
    |   |-- Skeletons.tsx, Spinner.tsx, FormInputs.tsx, RotatingText.tsx, icons.tsx
    `-- pages/
        |-- LandingPage.tsx, LoginPage.tsx, RegisterPage.tsx
        |-- DashboardPage.tsx, AddCoursePage.tsx
        |-- CourseDetailPage.tsx, UploadSyllabusPage.tsx
```

Routing in `App.tsx`: unauthenticated users hitting `/dashboard`, `/add-course`, `/add-course/upload`, or `/course/:courseId` are sent to `/login`; authenticated users hitting `/login` or `/register` are sent to `/dashboard`. The header and footer render on every route except the auth pages.

---

# 6. Frontend pages

- Landing. Value proposition, a rotating text hero, and login or signup (or go to dashboard when authenticated).
- Login and Register. Email and password into a stored JWT, then redirect to the dashboard. Register also takes a name.
- Dashboard. A grid of course cards, each with the current grade, graded versus ungraded weight, the highest still reachable letter and the average needed for it, a status badge, and a delete action. The add course flow offers manual entry or syllabus upload.
- Add Course. Name, semester, optional professor and notes, and the letter scale (minimum percent for A, B, C, D; F is the remainder), validated as strictly descending.
- Upload Syllabus. PDF uploader, then an editable review of the extracted draft, then create.
- Course Detail. The header, the grade calculator, the "Log a grade" box, the component list, and the Grade Coach, Run Scenario, Edit Grading Scale, and Delete actions. A desktop layout toggle switches between stacked and two column, persisted in localStorage.

---

# 7. Key components and contexts

- AuthContext. Holds the token, reads and clears it from localStorage, validates the session on load through `GET /api/auth/profile`, schedules a logout at the exact token expiry, and rechecks on window focus and storage events.
- ToastContext. A provider plus a body portal; success, error, info, and destructive variants with auto dismiss, hover to pause, and an optional action (used for undo).
- GradeCoach. The AI drawer. Posts to `/api/coach/:courseId`, renders the conversation, shows starter insight chips on first open, persists the conversation while the page is open, and refreshes the course when the coach reports a write. A New Chat button resets it.
- QuickGradeEntry. Posts a sentence to `/api/grade-entry/:courseId`, shows a preview, and applies the grade on confirm.
- GradeCalculator and GradeCharts. The summary card and the gauge and bars. The gauge color zones follow the course's custom scale.
- SessionTimeout. Tracks activity and shows a countdown dialog before the idle logout.

---

# 8. Backend architecture

```text
backend/
|-- railway.json                  Nixpacks build and start, health check path
|-- Dockerfile                    local docker-compose dev only
|-- .env.example
|-- tsconfig.json                 excludes *.test.ts from the build
`-- src/
    |-- index.ts                  Express app, CORS allowlist, rate limit, routes, /health, error handlers
    |-- config.ts                 Env loading, required var check, trust proxy and SSL parsing
    |-- db.ts                     pg pool, SSL toggled by DATABASE_SSL
    |-- middleware.ts             JWT verify guard and token generation (8h lifetime)
    |-- constants.ts              GradeScale type, default scale, parseScale, buildGradeScale
    |-- controllers/
    |   |-- authController.ts             register, login, getProfile
    |   |-- courseController.ts           course CRUD, scale on create
    |   |-- gradeComponentController.ts   component CRUD
    |   |-- gradeScaleController.ts       scale get and update
    |   |-- gradeCalculationController.ts single and batch calculation
    |   |-- syllabusController.ts         parse PDF, create from draft
    |   |-- coachController.ts            tool calling agent
    |   `-- gradeEntryController.ts       natural language grade entry
    |-- services/
    |   |-- ai.ts                 shared OpenAI client, DEFAULT_MODEL, isAiConfigured
    |   |-- gradeCalc.ts          computeResult, the grade engine (pure)
    |   |-- gradeCalc.test.ts
    |   |-- gradeEntry.ts         resolveGradeEntry (pure)
    |   `-- gradeEntry.test.ts
    `-- routes/
        |-- auth.ts, courses.ts, components.ts
        |-- gradeScale.ts, calculate.ts
        |-- coach.ts, gradeEntry.ts
```

Request path: routes apply `authenticate`, controllers validate with Joi and verify ownership, then call the pg pool or a service. The grade engine and the grade entry resolver are pure functions in `services/`, which is what makes them unit testable without a database or an OpenAI call.

---

# 9. Database schema

Four tables. There is no `syllabus_uploads` table: the syllabus parser is synchronous and stateless.

```sql
users            (id, email UNIQUE, password bcrypt, name, timestamps)
courses          (id, user_id FK, name, semester, professor?, notes?, timestamps)
grade_components (id, course_id FK, name, weight 0..100, graded, grade 0..100 or NULL, category?, timestamps)
grade_scales     (id, course_id FK UNIQUE, scale JSONB, timestamps)
```

- `weight` and `grade` carry CHECK constraints (0 to 100; grade may be NULL).
- `grade_scales.scale` defaults to the standard 90 80 70 60 mapping.
- Indexes on `courses(user_id)`, `grade_components(course_id)`, `grade_scales(course_id)`.
- A `set_updated_at` trigger keeps `updated_at` current on every table.
- All foreign keys are `ON DELETE CASCADE`, so deleting a user removes their courses, components, and scales.

---

# 10. API routes

Every route except register and login requires `Authorization: Bearer <token>`.

```text
# Health
GET    /health                        liveness for the platform

# Auth
POST   /api/auth/register             create account -> { user, token }
POST   /api/auth/login                login -> { user, token }
GET    /api/auth/profile              current user, used for load validation

# Courses
GET    /api/courses                   list the user's courses
POST   /api/courses                   create a course (with optional scale)
GET    /api/courses/:courseId         one course
PUT    /api/courses/:courseId         update name, semester, professor, notes
DELETE /api/courses/:courseId         delete a course
POST   /api/courses/parse-syllabus    PDF upload -> draft JSON (no DB write)
POST   /api/courses/from-draft        create course, scale, and components in one transaction

# Components
POST   /api/components                add a component
GET    /api/components/:courseId      list components for a course
PUT    /api/components/:componentId   update grade, graded, weight, name, category
DELETE /api/components/:componentId   delete a component

# Grade scale
GET    /api/grade-scale/:courseId     get the scale (default if none saved)
PUT    /api/grade-scale/:courseId     create or update the scale

# Calculation
GET    /api/calculate                 batch calculation for all the user's courses
GET    /api/calculate/:courseId       full calculation for one course

# AI
POST   /api/coach/:courseId           Grade Coach chat -> { reply, dataChanged }
POST   /api/grade-entry/:courseId     natural language grade -> { componentId, componentName, score }
```

Errors return `{ "error": "message" }` with an appropriate status. There is a global 300 requests per 15 minutes IP limit on `/api`, plus a tighter 20 per 15 minutes limit on syllabus upload.

---

# 11. Grade calculation engine

The engine lives in `services/gradeCalc.ts` as a pure `computeResult(components, scale)`, called by the calculation controller and covered by Vitest.

```text
earned_points    = sum(grade * weight / 100) over graded components
graded_weight    = sum(weight) over graded components
remaining_weight = sum(weight) over ungraded components
total_weight     = graded_weight + remaining_weight

current_grade    = earned_points / (graded_weight / 100)        rounded to 2 decimals
projected_max    = (current_grade * graded_weight + 100 * remaining_weight) / total_weight
required_average = (target_min * total_weight - current_grade * graded_weight) / remaining_weight
```

The current grade is rounded once, and the status badge is derived from that rounded value, so the badge always matches the number shown.

Per letter outcomes: no components yet gives "Add components to see requirements"; with no remaining weight it is "Already secured" or "No longer possible"; a required average above 100 is "No longer possible"; below 0 is "Already secured"; otherwise a percent like "87.50%".

Status: Excellent at or above A min, Good at or above B min, At Risk at or above C min, Needs Improvement below that, and "No components added" with no weight. Scenario planning runs the same math on the frontend with temporary values and saves nothing.

---

# 12. AI features

All three share `services/ai.ts` (one client, one `DEFAULT_MODEL`, one `isAiConfigured`). When no key is set, each feature returns a 503 with a friendly message and the rest of the app runs normally.

Grade Coach (`coachController.ts`). A tool calling loop over `gpt-4o` with the live course in the system prompt. Read tools: `getCourseSummary`, `calculateScenario`, `getRequiredScore`, `compareComponentImpact`. Write tools: `addComponents` (skips names that already exist), `updateComponents` (weight and rename), `removeComponents`, `setGrades`. Each tool reverifies course ownership and validates its inputs. When any write tool succeeds, the response carries `dataChanged: true`, and the drawer asks the page to refetch. The prompt forbids claiming a change unless a tool call actually succeeded.

Syllabus parser (`syllabusController.ts`). `parse-syllabus` takes a PDF (memory upload, 10MB cap, PDF only, tighter rate limit), sends it to OpenAI for a structured extraction, and returns a draft of name, semester, components, and scale with no database write. The user reviews and edits, then `from-draft` creates the course, scale, and components in one transaction with the same Joi validation as manual entry.

Natural language grade entry (`gradeEntryController.ts`). Sends the sentence plus the course's component list to `gpt-4o` in JSON mode, then runs the model output through the pure `resolveGradeEntry`, which checks the matched id belongs to the course and the score is 0 to 100. The deterministic resolver is unit tested; the model call is the only part that is not.

---

# 13. Authentication and sessions

```text
Login -> verify user and bcrypt compare -> sign a JWT (8 hour lifetime)
      -> frontend stores the token in localStorage
      -> axios attaches it to every request, middleware verifies it on protected routes
      -> on load, AuthContext calls /api/auth/profile and logs out on 401
      -> a timer logs the user out at the exact token expiry
      -> SessionTimeout logs the user out after 30 minutes idle, with a one minute warning dialog
      -> a 401 from any request clears the token
```

Token lifetime is `8h` in `middleware.ts`.

---

# 14. Validation and security

- Joi validation in every controller. Email valid and unique, password at least 6 characters, weights above 0 and at most 100, grades 0 to 100 when graded, scale strictly descending.
- Passwords are bcrypt hashed (10 rounds) and never returned to the client.
- Every protected handler verifies course or component ownership through `user_id` before reading or writing, so there is no IDOR across users.
- All SQL is parameterized. The dynamic update column lists are built from Joi validated keys only.
- JWT secret comes from `JWT_SECRET`; startup fails fast if required env vars are missing.
- CORS uses an allowlist from `CORS_ORIGIN`, with rate limiting, a 16kb JSON body cap, and `trust proxy` configurable for hosting behind a proxy.
- The syllabus upload is PDF only with a size cap and stays in memory.

---

# 15. Testing

Vitest runs the pure logic that has to be correct.

- `gradeCalc.test.ts` covers `computeResult`: empty, fully graded, partially graded, required per letter (numeric, secured, impossible), status thresholds, custom scales, the weight warning, rounding, string inputs, and the rounded status fix.
- `gradeEntry.test.ts` covers `resolveGradeEntry`: matched id and score, numeric string coercion, rounding, unknown id, missing component, missing score, and out of range scores.

Test files are excluded from the production build through `tsconfig.json`.

---

# 16. Environment variables

Backend (`backend/.env`): `PORT`, `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY`, `OPENAI_API_KEY`.

Frontend (`frontend/.env`): `VITE_API_URL`.

---

# 17. Deployment

The app deploys to Railway (API and Postgres) and Vercel (static frontend). `backend/railway.json` runs the build through Nixpacks (`npm run build` to `dist`, then `npm run start`) and points the health check at `/health`. `frontend/vercel.json` rewrites unknown paths to `index.html` for client routing. `db.ts` enables SSL when `DATABASE_SSL=true` for managed Postgres. Both halves auto deploy on every push to `main`. The full walkthrough is in `DEPLOY.md`.

---

# 18. Structural decisions

- One axios client for the JWT interceptor and base URL.
- React Context for auth and toasts, no extra state library.
- A shared `services/ai.ts` so all three AI features use one client and the model can change in one place.
- Pure functions for the grade engine and the grade entry resolver, separated from I/O so they can be unit tested.
- JSONB grade scales for atomic reads and writes and room for custom scales.
- A synchronous, stateless syllabus flow (draft then create), so there is no upload table to track.
- Coach writes flow back to the page through a `dataChanged` flag rather than a shared store.

---

# 19. Project structure

```text
WhatsMyGrade/
|-- frontend/                 React, TypeScript, Vite
|-- backend/                  Node, Express, TypeScript
|-- database/
|   |-- init.sql              schema, indexes, updated_at triggers
|   `-- README.md
|-- architecture/
|   |-- SystArchV0.md         original design record
|   |-- SystArchV1.md, SystArchV2.md   history
|   `-- SystArchV3.md         this document, current
|-- docker-compose.yml        Postgres, backend, frontend for local dev
|-- DEPLOY.md                 Railway and Vercel walkthrough
|-- README.md
|-- TODO.md
`-- setup.sh
```

---

# 20. Key differences from V2

| Area | V2 | V3 |
|------|----|----|
| Grade Coach | Not present | Tool calling agent with read and write tools, live page refresh |
| Natural language grade entry | Not present | `/api/grade-entry` plus the Log a grade box, with a tested resolver |
| Syllabus flow | Described an async upload table and polling | Synchronous parse to draft, then transactional create; no upload table |
| Scenario endpoint | Listed a `/api/calculate/scenario` route | Removed; scenario is computed on the frontend |
| Database tables | Listed `syllabus_uploads` | Four tables only, matching `init.sql` |
| Sessions | Fixed 7 day token | 8 hour token, load validation, expiry timer, idle auto logout |
| Tests | None | Vitest on the grade engine and the entry resolver |
| Deployment | Not covered | Railway and Vercel config, health check, DB SSL toggle |

---

# 21. Resume description

Built WhatsMyGrade, a full stack grade planning app. Students track course performance and see the exact average they need per letter grade, parse a syllabus PDF into components with AI, and use a Grade Coach chat that both answers planning questions and edits the course through tool calls. React and TypeScript frontend with charts, modals, and a hardened JWT session model; Node and Express API with a pure, unit tested grade engine; PostgreSQL with user scoped data; deployed on Railway and Vercel.

---

# 22. Future enhancements

- GPA across courses and semesters, weighted by credit hours.
- Grade trend charts and a semester view.
- A pre seeded demo account and a one click try demo button.
- CSV and PDF export.
- Per user cost limits on the AI endpoints.
