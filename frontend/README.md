# WhatsMyGrade Frontend

React 18 frontend for course grade tracking.

## Setup

1. Install dependencies: `npm install`
2. Configure environment: copy `.env.example` to `.env` (sets `VITE_API_URL=http://localhost:5001/api`)
3. Development: `npm run dev`
4. Build: `npm run build`

## Structure

- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main router configuration
- `src/AuthContext.tsx` - Authentication state management
- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/types.ts` - TypeScript type definitions
- `src/api.ts` - Axios API client

## Pages

LandingPage - Unauthenticated home page
RegisterPage - User registration
LoginPage - User login
DashboardPage - Course list and grade overview
CourseDetailPage - Individual course with grade components
AddCoursePage - Create new course with grading scale

## Dependencies

react, react-router-dom, axios, tailwindcss, vite
