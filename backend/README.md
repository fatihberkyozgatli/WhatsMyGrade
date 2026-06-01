# WhatsMyGrade Backend

Node.js Express API for course grade tracking and calculation.

## Setup

1. Install dependencies: `npm install`
2. Configure `.env` file with DATABASE_URL and JWT_SECRET
3. Build: `npm run build`
4. Development: `npm run dev` or `npx ts-node src/index.ts`
5. Production: `node dist/index.js`

## Structure

- `src/index.ts` - Express server setup
- `src/config.ts` - Configuration and environment variables
- `src/db.ts` - PostgreSQL connection pool
- `src/middleware.ts` - JWT authentication middleware
- `src/controllers/` - Business logic for each resource
- `src/routes/` - API endpoint definitions

## API Endpoints

Authentication: POST /api/auth/register, /api/auth/login, GET /api/auth/profile
Courses: GET/POST /api/courses, GET/PUT/DELETE /api/courses/:id
Components: GET/POST/PUT/DELETE /api/components
Calculations: GET /api/calculate/:courseId
Grade Scales: GET/PUT /api/grade-scale/:courseId

## Dependencies

express, cors, pg, joi, jsonwebtoken, bcryptjs, dotenv
