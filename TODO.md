# WhatsMyGrade — TODO

## Path to Production (current focus — in order)

1. [ ] **AI cost limits** — act on the June 2026 security review (below): OpenAI spend caps before going public
2. [ ] **Resume features** — GPA Calculator → Semester View → Demo Mode, on a tested + live base

---

## Tri-review Follow-ups (June 11, 2026: ui-ux-pro-max + code-review + security-review)

### Security — before promoting publicly
- [ ] **OpenAI spend ceiling (High):** confirm a hard billing limit on the OpenAI dashboard key; add `max_tokens` to all three `completions.create` calls (coach, syllabus, grade entry); add a per-user daily quota (limits are per-IP only today and the coach amplifies up to 5 calls/request); shrink the syllabus upload limit from 10 MB to 1–2 MB
- [ ] DB TLS: replace `rejectUnauthorized: false` in `db.ts` with CA-verified TLS
- [ ] Coach tool errors: return a generic message to the model instead of `String(err)` (can leak DB internals into chat replies)
- [ ] Fail startup if `CORS_ORIGIN` resolves to `*` in production
- [ ] Bump joi past the `link()` advisory when convenient; consider raising password min length 6 → 8

### Code review — correctness
- [ ] Coach CRUD tools write row-by-row and bail mid-loop on the first invalid item: validate everything before writing (or use a transaction), and set `dataChanged` based on rows actually written
- [ ] `/parse-syllabus`: run `parseLimiter` before `uploadPdf` so rate limiting applies before buffering up to 10 MB
- [ ] Skip the PUT + 2 GETs when a graded input blurs with an unchanged value (CourseDetailPage)
- [ ] Wrap `parseScale` in try/catch in the coach paths (a corrupt stored scale 502s every coach request)

### UI/UX — high value
- [ ] Invalid grade entry on mobile fails silently: the error banner renders off-screen above the scroll position; show the error inline at the row (or toast it) and keep focus in the field
- [ ] Header layout-toggle icon/aria-label never updates after clicking (reads localStorage at render, sets no state)
- [ ] Reset `#main` scroll (and move focus) on route change — scroll position currently leaks between pages
- [ ] Grade Coach drawer on desktop (lg+): drop `aria-modal`, the focus trap, and scroll lock so keyboard users can reach the page beside it; keep modal behavior on mobile

### UI/UX — smaller
- [ ] Touch targets <44px: coach quick-prompt chips, "New chat", toast dismiss X and Undo
- [ ] Add `aria-hidden` + `pointer-events-none` to the % suffix overlays in ScenarioModal and UploadSyllabusPage
- [ ] Course title on mobile: `line-clamp-2` instead of single-line truncate (hover title is unreachable on touch)
- [ ] Coach welcome copy says "You've secured 87.8%" when 87.8% is the average on graded work — reuse ScenarioModal's "Secured 45% of the grade at 87.8% average" phrasing
- [ ] Pause toast auto-dismiss on keyboard focus, not just mouse hover

---

## Post-deploy Fixes (found testing the live app)

- [ ] Maybe put the v1.0 to the footer?

---

## Grade Coach — Improvements

### Short-term
- [ ] Streaming responses (SSE) — reply starts appearing immediately instead of all at once
- [ ] Persist conversation in sessionStorage — survives page refresh within the session
- [ ] ScenarioModal integration — "Ask Grade Coach about this scenario" link inside the modal

### Medium-term
- [ ] `getStudyPlan` tool — given days until finals + remaining components, return a day-by-day study priority plan in plain English
- [ ] `trackGradeTrend` tool — analyze grade progression over time, surface "you've improved X points since midterms" type insights
- [ ] Multi-scenario comparison — "What if I get an A vs B on the final?" answered in one response

### Long-term
- [ ] Cross-course context — let Grade Coach see all courses in the semester, compute GPA impact
- [ ] Proactive insight cards — auto-generate a weekly digest per course, dismissable from the dashboard
- [ ] Export conversation — download as plain text or PDF

---

## AI Features (remaining)

### AI Study Advisor _(later — post v1.0)_
- [ ] Add "Get Study Plan" button on CourseDetailPage
- [ ] Send current grade, components, weights, and days until end of semester to AI
- [ ] Display personalized day-by-day study recommendations
- [ ] Show "what you need on each remaining component" in plain English

### Grade Trend Insights _(later — post v1.0)_
- [ ] On-demand AI digest per course — grade trajectory, strongest/weakest areas, actionable suggestions
- [ ] Dismissable insight card on DashboardPage and CourseDetailPage

---

## Core Missing Features

### GPA Calculator _(later — post v1.0)_
- [ ] Add credit hours field to courses
- [ ] Calculate GPA per semester (weighted by credit hours)
- [ ] Calculate cumulative GPA across all semesters
- [ ] Display on DashboardPage

### Data Visualizations _(later — post v1.0)_
- [ ] Grade trend line chart per course (grade over time as components are graded)
- [ ] Semester summary donut chart (grade distribution across courses)
- [ ] "What I need" bar chart — remaining components vs required scores

### Semester View _(later — post v1.0)_
- [ ] Group courses on DashboardPage by semester
- [ ] Collapsible semester sections
- [ ] Semester-level GPA and average grade shown per group

### Demo Mode
- [ ] Pre-seeded demo account (demo@whatsmygrade.com / demo)
- [ ] "Try Demo" button on LandingPage — logs in instantly, no registration
- [ ] Demo data: 3–4 courses across 2 semesters with realistic grade components

---

## UI / UX Polish (remaining)

- [ ] Mobile responsive audit and fixes

---

## Technical (remaining)

- [ ] CSV/PDF export of course grades
- [ ] Optimistic UI for grade updates (no full reload after edits)

---

## Audit Follow-ups (tri-review: frontend-design + ui-ux-pro-max) — remaining

### Quick wins
- [ ] Reset `--app-header-h` to `0px` when the header unmounts — toast offset is stale on `/login` and `/register`
- [ ] Bump "At Risk" yellow badge to `text-yellow-900` (light) — current `text-yellow-800` on `yellow-50` is ~4.0:1
- [ ] Key `UploadSyllabusPage` editable component rows by a stable id, not array index (wrong-row state on mid-list delete)
- [ ] Add `inputMode="decimal"` to the remaining raw number inputs (ScenarioModal, UploadSyllabusPage weights)
- [ ] Toast `destructive` variant uses a green-style CheckIcon tinted red — use a trash/info glyph instead

### Larger
- [ ] Body font: Atkinson Hyperlegible only ships 400/700, but UI uses `font-medium`/`font-semibold` (faux bold) — drop those to 700 or switch body font
- [ ] Render modals via a portal + unify the z-index scale (drawer 40 / modal 50 / toast 100)
- [ ] Reduced-motion guards on `GradeCalculator`, `GradeCoach` TypingDots, and `RotatingText` interval
- [ ] Grade Coach chat `aria-live` wraps the whole transcript — scope it to new assistant messages
- [ ] Logout uses a full-page reload — switch to SPA `navigate('/')`
- [ ] Per-field validation + focus-first-invalid in EditScaleModal / AddCoursePage / UploadSyllabusPage

---
---

# Completed

## Post-deploy Fixes
- [x] Footer is sticky and eats a big chunk of the mobile viewport — moved into the scroll flow
- [x] Grade Coach returns wrong numbers in some cases — coach tools now reuse the tested grade engine (`computeRequiredForLetter` / `computeScenario`), normalize by actual total weight, re-fetch fresh data after edits, fuzzy-match component names, and support "X on everything left" scenarios; covered by unit tests + live E2E check
- [x] Grade Components list looks cramped on mobile — name + weight top-left, delete top-right, Clear + score input (inline % suffix) right-aligned

## Path to Production
- [x] **Test the grade-calc engine** — unit-test `computeResult` (current/projected grade, required-score-per-letter, secured/impossible edges); thin auth happy-path test
- [x] **Deploy + CI/CD** — Railway (API + Postgres) + Vercel (frontend); `/health`, DB SSL toggle, deploy guide in `DEPLOY.md`
- [x] **Audit quick-wins** — cleared the quick wins under "Audit Follow-ups"

## AI Features

### Syllabus Parser
- [x] Add PDF upload endpoint to backend
- [x] Send syllabus text to AI, extract course name, semester, and grade components with weights
- [x] Auto-populate review form from parsed result
- [x] Handle edge cases: missing weights, missing scale, multi-page syllabi, +/- grade collapsing

### Grade Coach (AI Agent)
- [x] Right-side drawer with framer-motion slide-in and content shift
- [x] OpenAI tool-calling agent with calculation tools (getCourseSummary, calculateScenario, getRequiredScore, compareComponentImpact) + course CRUD tools (addComponents, updateComponents, removeComponents, setGrades)
- [x] Course context shown in drawer header (current grade, remaining weight, status)
- [x] Quick action chips + free-form chat input
- [x] Toggle open/close from Course Detail page
- [x] Mini insight chips under the welcome message (biggest remaining component, needed for A, risk level)

### Natural Language Grade Entry
- [x] Chat input on CourseDetailPage: "I got an 85 on my midterm"
- [x] AI matches to existing component, shows preview, saves on confirm

## UI / UX Polish
- [x] Desktop split-view layout toggle (stacked ↔ two-column) on Course Detail, persisted in localStorage
- [x] Redesign login/sign-up page — split-screen layout (form + brand panel)
- [x] Fix Score button — the score text gets cut off / isn't fully visible
- [x] Grade inputs — inline "%" suffix and validate on blur
- [x] GradeGauge color zones should follow the course's custom grade scale (currently hard-coded 90/80/70)
- [x] Loading skeletons instead of spinners while fetching
- [x] Toast notifications (success + destructive with Undo) — course/component create/delete, scale save
- [x] Help / info button in the navbar — context-aware popup (different content for dashboard, course pages, landing, login/signup)
- [x] Footer: Privacy Policy, Contact, GitHub, "Built by Fatih Berk Yozgatli"

## Technical
- [x] Deploy the app (hosting + CI/CD) — Railway + Vercel

## Legal
- [x] Terms of Service / user agreement (page or modal, linked from signup and footer)
- [x] Disclaimer — grades are estimates, not official records

## Audit Follow-ups
- [x] Swap app shell `h-screen` → `h-dvh`/`min-h-dvh` so mobile browser chrome doesn't clip the footer
- [x] Inline spinner inside submit buttons during async (Login, Register, AddCourse, Grade Coach send)
- [x] Mobile touch targets <44px — inline grade inputs height, icon-only delete/close buttons (~28px), mobile nav links
- [x] Move inputs to ≥16px on mobile to stop iOS focus auto-zoom
