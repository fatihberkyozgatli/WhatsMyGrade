# WhatsMyGrade

Track your course grades and find out exactly what you need on what is left.

WhatsMyGrade is a full stack web app for students. You add a course, define its grade components and weights, and it shows your current grade, the maximum you can still reach, and the exact average you need on the remaining work for every letter grade. On top of that it ships an AI Grade Coach that runs the math for you and can set up a course straight from a chat, a syllabus parser that reads a PDF into components, and natural language grade entry.

Live demo: add your Vercel URL once deployed.

## What it does

- Grade engine. Current grade, maximum obtainable, and the score you need on the remaining work for each letter grade. Every course gets its own editable letter scale, and the standing badge (Excellent, Good, At Risk, Needs Improvement) follows that scale.
- AI Grade Coach. A chat agent with live access to your course. Ask it whether an A is still possible, what happens if you score 80 on everything left, or which component matters most, and it runs the real calculation instead of guessing. It can also manage the course for you: add, rename, reweight, and remove components, and log grades, all from the chat, with the page updating as it works.
- Syllabus parser. Upload a PDF syllabus and it extracts the course name, components, and weights for you to review before the course is created.
- Natural language grade entry. Type something like "I got an 85 on my midterm", and it matches the component, shows a preview, and logs it once you confirm.
- Scenario planning. A what if calculator to test hypothetical scores without saving anything.
- Everything else. JWT auth with both idle and absolute session timeouts, a custom grade scale per course, dark mode, loading skeletons, toasts, a context aware help menu, and a layout that works on mobile.

## Tech

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router.
- Backend: Node, Express, TypeScript, PostgreSQL, JWT, bcrypt, Joi, OpenAI.
- Tests: Vitest on the grade engine and the grade entry resolver.

## Running it locally

You need Node 18 or newer and PostgreSQL 12 or newer.

### Docker

```
docker-compose up
```

This starts Postgres, the API on port 5001, and the frontend on port 5173.

### Manual

1. Create a database and load the schema:
   ```
   psql -U <user> -d <database> -f database/init.sql
   ```
2. Copy the env files and fill them in:
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Set `DATABASE_URL` and `JWT_SECRET` at minimum. `OPENAI_API_KEY` is optional: the app boots without it and the AI features just report that they are unavailable.
3. Install and run:
   ```
   npm install --prefix backend && npm run dev --prefix backend
   npm install --prefix frontend && npm run dev --prefix frontend
   ```
4. Open http://localhost:5173

### Tests

```
npm test --prefix backend
```

## Deploying

The app deploys to Railway (API and Postgres) and Vercel (frontend). The full walkthrough, including every environment variable, is in `DEPLOY.md`.

## Architecture

The current as built reference is in `architecture/SystArchV3.md`. Earlier versions (V0, V1, V2) sit in the same folder for history.

## Built by

Fatih Berk Yozgatlı. Portfolio at https://fatihberkyozgatli.com
