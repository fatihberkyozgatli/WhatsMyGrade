# WhatsMyGrade — TODO

## Path to Production (current focus — in order)

1. [x] **Test the grade-calc engine** — unit-test `computeResult` (current/projected grade, required-score-per-letter, secured/impossible edges); thin auth happy-path test
2. [ ] **Deploy + CI/CD** — hosting + pipeline + basic error monitoring (deploy early, iterate)
3. [ ] **Security review + AI cost limits** — security pass; cap/abuse-guard the OpenAI endpoints before going public
4. [ ] **Audit quick-wins** — clear the quick wins under "Audit Follow-ups"
5. [ ] **Resume features** — GPA Calculator → Semester View → Demo Mode, on a tested + live base

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

## AI Features

### 1. Syllabus Parser
- [x] Add PDF upload endpoint to backend
- [x] Send syllabus text to AI, extract course name, semester, and grade components with weights
- [x] Auto-populate review form from parsed result
- [x] Handle edge cases: missing weights, missing scale, multi-page syllabi, +/- grade collapsing

### 2. Grade Coach (AI Agent)
- [x] Right-side drawer with framer-motion slide-in and content shift
- [x] OpenAI tool-calling agent with 4 tools: getCourseSummary, calculateScenario, getRequiredScore, compareComponentImpact
- [x] Course context shown in drawer header (current grade, remaining weight, status)
- [x] Quick action chips + free-form chat input
- [x] Toggle open/close from Course Detail page
- [x] Grade Coach drawer çok boş duruyor ilk açılışta. İlk mesajın altına direkt 2-3 mini insight ekle:
“Biggest remaining component: Human Rights Journal”
“Needed for A: 50%”
“Risk level: Low”

### 3. AI Study Advisor _(later — post v1.0)_
- [ ] Add "Get Study Plan" button on CourseDetailPage
- [ ] Send current grade, components, weights, and days until end of semester to AI
- [ ] Display personalized day-by-day study recommendations
- [ ] Show "what you need on each remaining component" in plain English

### 4. Natural Language Grade Entry
- [ ] Chat input on CourseDetailPage: "I got an 85 on my midterm"
- [ ] AI matches to existing component, shows preview, saves on confirm

### 5. Grade Trend Insights _(later — post v1.0)_
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

## UI / UX Polish

- [x] Desktop split-view layout toggle (stacked ↔ two-column) on Course Detail, persisted in localStorage
- [x] Redesign login/sign-up page — split-screen layout (form + brand panel)
- [x] Fix Score button — the score text gets cut off / isn't fully visible
- [x] Grade inputs — inline "%" suffix and validate on blur
- [x] GradeGauge color zones should follow the course's custom grade scale (currently hard-coded 90/80/70)
- [x] Loading skeletons instead of spinners while fetching
- [ ] Mobile responsive audit and fixes
- [x] Toast notifications (success + destructive with Undo) — course/component create/delete, scale save
- [x] Help / info button in the navbar — context-aware popup (different content for dashboard, course pages, landing, login/signup)
- [x] Footer: Still feels slightly "student project." I'd add: Privacy Policy, Contact, GitHub and: Built by Fatih Berk Yozgatli at the very bottom.
---

## Technical

- [ ] CSV/PDF export of course grades
- [ ] Optimistic UI for grade updates (no full reload after edits)
- [ ] Deploy the app (hosting + CI/CD)

---

## Legal

- [x] Terms of Service / user agreement (page or modal, linked from signup and footer)
- [x] Disclaimer — grades are estimates, not official records

---

## Audit Follow-ups (tri-review: frontend-design + ui-ux-pro-max)

### Quick wins
- [ ] Reset `--app-header-h` to `0px` when the header unmounts — toast offset is stale on `/login` and `/register`
- [ ] Bump "At Risk" yellow badge to `text-yellow-900` (light) — current `text-yellow-800` on `yellow-50` is ~4.0:1
- [x] Swap app shell `h-screen` → `h-dvh`/`min-h-dvh` so mobile browser chrome doesn't clip the footer
- [ ] Key `UploadSyllabusPage` editable component rows by a stable id, not array index (wrong-row state on mid-list delete)
- [ ] Add `inputMode="decimal"` to the remaining raw number inputs (ScenarioModal, UploadSyllabusPage weights)
- [x] Inline spinner inside submit buttons during async (Login, Register, AddCourse, Grade Coach send)
- [ ] Toast `destructive` variant uses a green-style CheckIcon tinted red — use a trash/info glyph instead

### Larger
- [ ] Body font: Atkinson Hyperlegible only ships 400/700, but UI uses `font-medium`/`font-semibold` (faux bold) — drop those to 700 or switch body font
- [x] Mobile touch targets <44px — inline grade inputs height, icon-only delete/close buttons (~28px), mobile nav links
- [x] Move inputs to ≥16px on mobile to stop iOS focus auto-zoom
- [ ] Render modals via a portal + unify the z-index scale (drawer 40 / modal 50 / toast 100)
- [ ] Reduced-motion guards on `GradeCalculator`, `GradeCoach` TypingDots, and `RotatingText` interval
- [ ] Grade Coach chat `aria-live` wraps the whole transcript — scope it to new assistant messages
- [ ] Logout uses a full-page reload — switch to SPA `navigate('/')`
- [ ] Per-field validation + focus-first-invalid in EditScaleModal / AddCoursePage / UploadSyllabusPage
