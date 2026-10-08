# Campus Team Flow

A modern university team management dashboard built with React + Vite.

## Project Overview
This project is a front-end prototype for a team management system designed for university project teams. It includes:

- Admin dashboard
- Member dashboard
- Login and registration
- Task management
- Announcements
- Project details section
- Team chat
- Profile editing
- Team member management
- Shared project gallery

## Tech Stack
- React
- Vite
- React Router
- LocalStorage for data persistence

## Folder Structure

```bash
campus-team-flow/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── README.md
└── package-lock.json
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open:

```bash
http://localhost:5173
```

## Default Login Accounts

### Admin
- Academic ID: 2520734
- Password: 01020477993mma

### Member 1
- Academic ID: IT-101
- Password: aisha123

### Member 2
- Academic ID: IT-102
- Password: omar123

### Member 3
- Academic ID: IT-103
- Password: nora123

## Notes
- This project is a front-end prototype.
- Data is stored in browser localStorage.
- It is meant for demonstration, UI testing, and project presentation.
- It is not a fully real production backend system.

## Team Use
Use the app in the browser and keep each user in a separate browser session to avoid data conflict.

## Important
If you want a fully real system with database, authentication, and shared multi-user data, the next step is to implement a backend with Express + database and real JWT auth.
