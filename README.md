# WhatsMyGrade

A full-stack web application for tracking course grades and calculating the scores needed to reach a target grade.

## Features

- Track courses and their grade components (exams, assignments, etc.)
- Calculate the score needed on remaining work to reach a target grade
- User authentication with per-user course data
- Letter-grade scale mapping for final grade calculation

## Requirements

Node.js (v16+), PostgreSQL (v12+)

## Setup

### Option A: Docker

```
docker-compose up
```

This starts PostgreSQL, the backend (port 5001), and the frontend (port 5173).

### Option B: Manual

1. Set up the database:
   - Create a PostgreSQL database
   - Run: `psql -U username -d database_name -f database/init.sql`
2. Configure environment variables:
   - Backend: copy `backend/.env.example` to `backend/.env` and fill in your database credentials
   - Frontend: copy `frontend/.env.example` to `frontend/.env`
3. Install dependencies:
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
4. Run:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

Access the application at http://localhost:5173

## Architecture

- **Backend:** Node.js Express API with PostgreSQL
- **Frontend:** React 18 with TypeScript and Tailwind CSS
- **Database:** PostgreSQL with user authentication and course/grade tracking

See `backend/README.md`, `frontend/README.md`, and `database/README.md` for details.
