# Production Deployment Plan

## Recommended architecture

- Frontend: Vercel
- Backend: Render or Railway
- Database: PostgreSQL (Render Postgres, Supabase, Neon)
- Storage: Supabase Storage or Cloudinary

## Why this setup is required

The original backend used SQLite and `better-sqlite3`, which is a native Node package and is not suitable for Vercel/serverless hosting. For real client usage, the backend must run as a normal Node service with PostgreSQL.

This project has already been migrated to a PostgreSQL-compatible database layer and validated locally.

## 1) Backend on Render

1. Open Render and create a new Web Service.
2. Connect your GitHub repo.
3. Set the Root Directory to `campus-team-flow/backend`.
4. Build command:
   - `npm install`
5. Start command:
   - `npm start`
6. Add environment variables:
   - `PORT=5000`
   - `JWT_SECRET=your_long_secret_here`
   - `FRONTEND_URL=https://your-frontend-url.vercel.app`
   - `DATABASE_URL=postgresql://user:password@host:5432/dbname`
7. Create a PostgreSQL database from Render or Supabase.
8. Deploy.

Example env file:

```env
PORT=5000
JWT_SECRET=super_secure_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campus_team_flow
```

## 2) Frontend on Vercel

1. Import the repo to Vercel.
2. Set the Root Directory to `campus-team-flow/frontend`.
3. Add environment variable:
   - `VITE_API_URL=https://your-render-backend-url/api`
4. Deploy.

Example:

```env
VITE_API_URL=https://campus-team-flow-api.onrender.com/api
VITE_APP_NAME=Brainx Team
```

## 3) Files already prepared

- [campus-team-flow/backend/.env.example](campus-team-flow/backend/.env.example)
- [campus-team-flow/frontend/.env.example](campus-team-flow/frontend/.env.example)
- [campus-team-flow/render.yaml](campus-team-flow/render.yaml)
- [campus-team-flow/frontend/vercel.json](campus-team-flow/frontend/vercel.json)

## 4) Local development

Frontend:

```bash
cd campus-team-flow/frontend
npm install
npm run dev -- --host 0.0.0.0
```

Backend:

```bash
cd campus-team-flow/backend
npm install
npm start
```

## 5) Final deployment checklist

- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` set in Render
- [ ] `JWT_SECRET` set
- [ ] `VITE_API_URL` set in Vercel
- [ ] Deploy backend first
- [ ] Deploy frontend second
- [ ] Test login/register and admin flow

## Verified status

The current codebase has been verified locally:

- Backend health endpoint responds successfully
- Frontend production build succeeds

This confirms the application is ready for the production deployment structure, with the real external database and hosting URLs still required for live client use.
