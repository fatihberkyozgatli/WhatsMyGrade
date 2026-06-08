# WhatsMyGrade — TODO

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

### 3. AI Study Advisor
- [ ] Add "Get Study Plan" button on CourseDetailPage
- [ ] Send current grade, components, weights, and days until end of semester to AI
- [ ] Display personalized day-by-day study recommendations
- [ ] Show "what you need on each remaining component" in plain English

### 4. Natural Language Grade Entry
- [ ] Chat input on CourseDetailPage: "I got an 85 on my midterm"
- [ ] AI matches to existing component, shows preview, saves on confirm

### 5. Grade Trend Insights
- [ ] On-demand AI digest per course — grade trajectory, strongest/weakest areas, actionable suggestions
- [ ] Dismissable insight card on DashboardPage and CourseDetailPage

---

## Core Missing Features

### GPA Calculator
- [ ] Add credit hours field to courses
- [ ] Calculate GPA per semester (weighted by credit hours)
- [ ] Calculate cumulative GPA across all semesters
- [ ] Display on DashboardPage

### Data Visualizations
- [ ] Grade trend line chart per course (grade over time as components are graded)
- [ ] Semester summary donut chart (grade distribution across courses)
- [ ] "What I need" bar chart — remaining components vs required scores

### Semester View
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
- [ ] Fix Score button — the score text gets cut off / isn't fully visible
- [x] Grade inputs — inline "%" suffix and validate on blur
- [ ] GradeGauge color zones should follow the course's custom grade scale (currently hard-coded 90/80/70)
- [ ] Loading skeletons instead of spinners while fetching
- [ ] Mobile responsive audit and fixes
- [ ] Toast notifications for save/delete/error actions

---

## Integrations

- [ ] Look into Canvas API — could it auto-pull course grades/components? (needs research, not sure yet if feasible)

---

## Technical

- [ ] CSV/PDF export of course grades
- [ ] Optimistic UI for grade updates (no full reload after edits)
- [ ] Deploy the app (hosting + CI/CD)
