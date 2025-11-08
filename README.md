# Alok Library - Student Subscription Management

A full-stack application for managing coaching centre subscriptions with role-based access, multilingual support (English/Hindi), analytics, expenses tracking, notifications, and student notes.

## ✨ Features

- Student management with subscription status, renewal workflow, payment tracking, and detailed modals
- Admin/Tutor dashboards with analytics, notifications, expenses, and bulk search filters
- Student self-service portal (notes, notifications, Hindi UI support)
- Role-based access (admin, teacher, student) with JWT authentication
- Notifications and notes respect subscription state (expired students see renewal prompt only)
- Multi-language UI (English & Hindi) with contextual translations
- Responsive design built with Tailwind CSS

## 🧰 Tech Stack

### Frontend
- React 18 + TypeScript (Vite)
- Tailwind CSS
- Context-based i18n

### Backend
- Node.js + Express
- PostgreSQL (via `pg`)
- JWT auth & bcrypt password hashing

## 📁 Project Structure

```
├── backend/                # Express API (Node 18+)
│   ├── config/             # Database connection helpers
│   ├── controllers/        # Request handlers
│   ├── routes/             # API routes
│   ├── utils/              # DB + auth utilities
│   ├── scripts/            # Maintenance scripts (migrations, reset, etc.)
│   └── env.example         # Environment variable template
│
├── src/                    # React application source
├── public/                 # Static assets
├── env.example             # Frontend environment template (copy to .env)
└── README.md               # (this file)
```

## ⚙️ Environment Variables

### Frontend (`env.example` → `.env` next to `package.json`)
```
VITE_API_URL=http://localhost:3000/api
```
Set this to your backend URL (including `/api`).

### Backend (`backend/env.example` → `backend/.env`)
Either fill individual values or a single `DATABASE_URL`:
```
# Database values (or use DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alok_library
DB_USER=postgres
DB_PASSWORD=postgres
# DATABASE_URL=postgres://user:password@host:5432/alok_library
# DB_SSL=true

# Server
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
SERVE_FRONTEND=false

# Authentication
JWT_SECRET=change-me
JWT_EXPIRES_IN=24h
```
- `FRONTEND_ORIGIN` accepts a comma-separated list of allowed origins for CORS (set this to your deployed frontend URL).
- Set `SERVE_FRONTEND=true` and copy the built React app into `backend/dist` if you want the backend to serve static files (useful for single-service deployments).
- Set `DB_SSL=true` when connecting to managed Postgres that requires SSL (Railway, Supabase, Neon, etc.).

## 🛠️ Local Development

1. **Install dependencies**
   ```bash
   # backend
   cd backend
   npm install

   # frontend (project root)
   cd ..
   npm install
   ```

2. **Configure environment variables**
   - Copy `backend/env.example` → `backend/.env` and adjust values.
   - Copy `env.example` → `.env` (project root) and adjust `VITE_API_URL` if needed.

3. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```
   The API listens on `http://localhost:3000` by default and auto-creates required tables.

4. **Start the frontend** (new terminal)
   ```bash
   npm run dev
   ```
   The app runs on `http://localhost:5173` by default.

## 🏗️ Production Build

- Build React app: `npm run build` (outputs `dist/`).
- Preview production build locally: `npm run preview`.
- Run backend in production: `cd backend && npm start` (ensure `NODE_ENV=production`).

## 🚀 Deploying to Railway (Free Tier Friendly)

1. **Create a Railway project & Postgres service**
   - Click **New Project → Provision PostgreSQL**.
   - Railway exposes `DATABASE_URL` and individual connection variables. Use either form; SSL is handled automatically via `DB_SSL`.

2. **Deploy the backend service**
   - **New Service → Deploy from GitHub** and choose the repo.
   - Set root directory to `backend`.
   - Build command: `npm install`
   - Start command: `npm run start`
   - Configure variables (either reference Postgres service or paste manually):
     - `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, etc.)
     - `JWT_SECRET` (generate a strong random value)
     - `JWT_EXPIRES_IN` (example: `24h`)
     - `FRONTEND_ORIGIN` (e.g., `https://your-frontend.up.railway.app`)
     - `PORT` (Railway supplies this automatically, but the server already respects it)
     - `DB_SSL=true` when using managed Postgres

3. **(Optional) Serve frontend from the same service**
   - Build React app (`npm run build`) and copy the `dist` folder into `backend/dist`.
   - Set `SERVE_FRONTEND=true` so Express serves static files.

4. **Alternative: deploy frontend separately**
   - Keep backend on Railway.
   - Deploy React `dist/` to Vercel/Netlify/Cloudflare Pages.
   - Set `VITE_API_URL` to the Railway backend domain (include `/api`).

5. **Verify deployment**
   - Check `/api/health` to verify backend is running.
   - Log in with default credentials (admin/admin123, teacher/teacher123) and update passwords.
   - Confirm CORS works (frontend can reach backend) and that notes/notifications respect subscription state.

## 🧩 Scripts & Utilities

- `backend/scripts/migrate.js` – run schema migrations manually (Railway shell: `railway run npm run migrate`).
- `backend/scripts/add-sample-students.js` – seed demo data.
- `backend/scripts/generate-student-credentials.js` – generate credentials for imports.

## 🔒 Security Checklist Before Production

- Change default admin/teacher passwords immediately.
- Set a strong `JWT_SECRET`.
- Enable SSL (`DB_SSL=true`) when using hosted databases.
- Restrict `FRONTEND_ORIGIN` to trusted domains only.
- Schedule regular database backups (Railway Postgres offers snapshots on paid tiers).

Happy deploying! 🎉
