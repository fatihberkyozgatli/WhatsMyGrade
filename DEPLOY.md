# Deploying WhatsMyGrade

Stack: **Railway** (Express API + Postgres) and **Vercel** (React frontend). Both auto-deploy on every push to `main`.

## 1 — API + database on Railway

1. At [railway.com](https://railway.com), create a project → **Deploy from GitHub repo** → pick `WhatsMyGrade`.
2. Open the new service → **Settings** → set **Root Directory** to `backend`. It picks up `backend/railway.json` (Nixpacks → `npm run build` → `npm run start`, health check at `/health`).
3. In the project, **New → Database → PostgreSQL**.
4. Open the Postgres service → **Query** (or connect with `psql`) and run the contents of `database/init.sql` once to create the tables.
5. Back on the API service → **Variables**, set:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}` (reference the Postgres service)
   - `DATABASE_SSL` → `false` with the internal URL above; `true` if you switch to the public DB URL
   - `JWT_SECRET` → a long random string
   - `OPENAI_API_KEY` → your OpenAI key
   - `TRUST_PROXY` → `true`
   - `CORS_ORIGIN` → your Vercel URL (fill in after step 2; redeploy after)
   - `PORT` is provided by Railway automatically — don't set it.
6. Deploy, then note the public API URL (e.g. `https://whatsmygrade-api.up.railway.app`). Check `GET /health` returns `{ "status": "ok" }`.

## 2 — Frontend on Vercel

1. At [vercel.com](https://vercel.com), **Add New → Project** → import `WhatsMyGrade`.
2. Set **Root Directory** to `frontend` (framework auto-detects as Vite).
3. Add env var `VITE_API_URL` → `https://<your-railway-api>/api`.
4. Deploy. `frontend/vercel.json` handles client-side routing.
5. Copy the Vercel URL, set it as `CORS_ORIGIN` on the Railway API (step 1.5), and redeploy the API.

## 3 — Verify

- Open the Vercel URL, register an account, add a course, log a grade, open Grade Coach.
- Every push to `main` redeploys both halves automatically.

## Environment variables

**Backend (Railway)** — see `backend/.env.example`: `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY`, `OPENAI_API_KEY` (`PORT` is injected by Railway).

**Frontend (Vercel)** — `VITE_API_URL` (your API origin + `/api`).
