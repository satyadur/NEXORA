## Dynamic Assignment Maker – Project Overview

This document explains the overall structure of your project and how the **backend** and **frontend** work together. It is meant as a quick reference when you are browsing the `backend` and `frontend` folders.

---

## High-level architecture

- **Backend**: Node.js + Express API (ES modules) with MongoDB via Mongoose, JWT-based authentication, role-based access control, file uploads, Cloudinary storage, and cron jobs for attendance/holiday processing.
- **Frontend**: Next.js (App Router) + React + TypeScript with Tailwind CSS, shadcn-style UI components, TanStack React Query for data fetching, Axios for the API client, and Recharts/GSAP for rich dashboards and animations.
- **Domain**: A learning and HR platform for assignments, classrooms, courses, attendance (students and staff), payroll, HR documents, and public “top students/faculty” marketing data.

---

## Backend (`backend`)

### Tech stack

- **Runtime & framework**: Node.js, Express 5 (`type: "module"`).
- **Database**: MongoDB via **Mongoose** models.
- **Auth**: JWT tokens, authentication middleware, and role-based guards.
- **File handling**: Multer for uploads + Cloudinary for storage.
- **Background jobs**: `node-cron` for attendance/holiday related tasks.
- **Scripts** (from `backend/package.json`):
  - `npm run dev` – start backend in dev mode with `nodemon src/server.js`.
  - `npm start` – start backend with `node src/server.js`.
  - `npm run seed` – run `seed.js` to populate the database with demo data.

### Structure and main files

- **`src/server.js`**
  - Entry point for the API server.
  - Loads environment variables, connects to MongoDB, imports cron services, and starts the Express app.
- **`src/app.js`**
  - Creates and configures the Express app.
  - Applies middlewares: JSON parsing, CORS, security headers, logging, etc.
  - Mounts all route modules under `/api/*`, for example:
    - `/api/auth` – authentication and profile.
    - `/api/admin` – admin dashboards, users, analytics, payroll.
    - `/api/teacher` – teacher dashboard, assignments, classroom management, attendance.
    - `/api/student` – student dashboard, assignments, submissions, classrooms.
    - `/api/courses` – course and category management, enrollments.
    - `/api/classrooms` – admin classroom CRUD.
    - `/api/submissions` – generic submission endpoints.
    - `/api/public` – public data for the landing page (top students/faculty).

### Auth & middleware

- **Auth routes & controller** (`auth.routes.js`, `auth.controller.js`)
  - Registration and login (returns a JWT).
  - `/me` and profile endpoints for the current user.
  - Uses JWT utilities to create and verify tokens.
- **Middlewares**
  - **Auth middleware** – reads `Authorization: Bearer <token>` from requests, validates the JWT, and attaches the user to `req.user`.
  - **Role middleware** – checks `req.user.role` to ensure that only the correct roles (admin, teacher, student, etc.) can access a given route.
  - **Upload middleware** – wraps Multer for handling file uploads such as avatars and documents.

### Domain routes & controllers (high level)

- **Admin**
  - Dashboards and analytics (global stats, monthly growth, assignment performance).
  - Managing teachers, students, and faculty admins (CRUD + detail views).
  - Employee management and attendance summaries.
  - Payroll and payslips (summary, issue/download/update status).
  - Leaves and salary info per teacher.
- **Teacher**
  - Teacher dashboard and analytics (class performance, assignment statistics).
  - Managing teacher-owned classrooms (list, details, students, analytics).
  - Full assignment lifecycle for a teacher: create, update, publish, list, and review submissions.
  - Student attendance per classroom.
  - Teacher self-attendance with geolocation and QR code flows.
- **Student**
  - Student dashboard with performance and progress.
  - Viewing assignments and their details.
  - Submitting assignments and viewing submission history.
  - Joining and viewing classrooms.
- **Courses & classrooms**
  - Courses, categories, and enrollments.
  - Admin classroom CRUD and adding students to classrooms.
- **Public**
  - Public endpoints for faculty highlights and top students (used on the marketing landing page).

### Data models and background jobs

- **User model**
  - Supports multiple roles: admin, faculty admin, teacher, student.
  - Stores personal, academic, and employment-related fields.
  - Includes methods and hooks for password hashing, IDs, and role-specific data.
- **Other models**
  - Courses, categories, enrollments, classrooms, assignments, questions, submissions.
  - Attendance for students and staff, payroll (payslips), employee documents, student certificates, geofencing/QR attendance.
- **Cron services**
  - Attendance and holiday cron jobs are imported in `server.js` so they run automatically when the server starts.

### Seeding and configuration

- **`seed.js`**
  - Connects to MongoDB, wipes existing data, and creates a full demo dataset (admins, faculty admins, teachers, students, courses, classrooms, assignments, submissions, attendance, payroll, documents).
- **Environment**
  - Environment variables configure the server port, database URI, JWT settings, and third-party integrations (like Cloudinary). These are loaded from `.env` and must be set correctly before running the backend.

---

## Frontend (`frontend`)

### Tech stack

- **Framework**: Next.js (App Router) with React and TypeScript.
- **Styling**: Tailwind CSS and shadcn-style UI components.
- **Data fetching**: TanStack React Query for client-side fetching, caching, and mutations.
- **HTTP client**: Axios with a shared instance that injects the JWT token from cookies.
- **State/UX utilities**: React Hook Form + Zod for forms, Recharts for charts, GSAP/framer-motion for animations, and PWA support with `next-pwa`.
- **Scripts** (from `frontend/package.json`):
  - `npm run dev` – start the Next.js dev server.
  - `npm run build` – build the production bundle.
  - `npm start` – run the production server.
  - `npm run lint` – run ESLint.

### Overall structure

- **`app/layout.tsx`**
  - Root layout that wraps the entire app with:
    - Theme provider (light/dark).
    - React Query provider.
    - Tooltip and toast providers.
    - Fonts and global styles.
  - Also integrates the offline/PWA experience (offline screen).
- **App Router segments**
  - `app/(main)` – public marketing pages (landing page, hero, faculty/top students sections).
  - `app/auth/*` – login and registration pages (with guards that redirect authenticated users).
  - `app/admin/*` – admin dashboard and management pages.
  - `app/teacher/*` – teacher dashboard, assignments, classrooms, attendance, and evaluation flows.
  - `app/student/*` – student dashboard, assignments, submissions, and classrooms.
  - Each role section typically has its own `layout.tsx` that renders the sidebar, header, and role-specific navigation.

### Key components

- **Layout and navigation**
  - Sidebar, top navigation bar, and layout shells that give each role a consistent UI.
  - Role-specific navigation items defined in small configuration files (e.g., lists of routes with labels and icons).
- **UI kit**
  - Reusable components under `components/ui` (buttons, inputs, forms, dialogs, tables, charts, etc.).
  - Shared helpers for cards, metrics, and dashboard widgets.
- **Domain-specific components**
  - Assignment lists and detail views, submission lists and evaluation UIs.
  - Attendance tables and charts.
  - Public marketing sections (hero, course packages, faculty, top students).

### Data fetching, auth, and API client

- **Axios client**
  - Centralized Axios instance configured with `baseURL` from `NEXT_PUBLIC_API_URL`.
  - Automatically attaches the `Authorization: Bearer <token>` header using a token stored in cookies.
  - On `401` responses, clears auth cookies and redirects to the home page.
- **React Query**
  - All role dashboards and pages use React Query hooks to fetch data from the backend and keep it cached/up-to-date.
  - Examples: student dashboard, teacher dashboard, admin stats, attendance history, assignments and submissions.
- **Auth flow**
  - Login: sends credentials to the backend login endpoint and stores the returned token and role in cookies.
  - `useMe` hook: calls the `/auth/me` API to get the current user and role, and is used to protect layouts and redirect on error.
  - **`middleware.ts`**:
    - Treats `/`, `/auth/login`, `/auth/register` as public routes.
    - For all other routes, if there is no token cookie, redirects to `/`.

### Role flows (simplified)

- **Admin**
  - Views high-level stats, growth, assignment performance, and analytics for students/faculty.
  - Manages teachers, students, and faculty admins.
  - Monitors assignments and submissions across the system.
  - Manages payroll, payslips, and employee documents.
- **Teacher**
  - Manages their own classrooms and assignments.
  - Tracks student submissions and evaluates them.
  - Marks and reviews student attendance.
  - Handles self-attendance (check-in/out, QR/geofence).
- **Student**
  - Views dashboard with learning progress and performance.
  - Sees current and upcoming assignments.
  - Submits work and reviews feedback.
  - Joins and interacts with classrooms.

---

## Frontend–backend interaction

- **Base URL and environment**
  - The frontend uses `NEXT_PUBLIC_API_URL` to know where the backend API is hosted (usually your backend server URL with `/api`).
  - Both apps must agree on this base URL so that all Axios requests reach the correct backend routes.
- **Authentication**
  - The backend exposes `/api/auth/login` and `/api/auth/me` (and related endpoints) for login and user info.
  - The frontend’s auth APIs call these endpoints, store the token/role in cookies, and use them to protect routes and layouts.
- **Assignments and submissions**
  - Teacher UIs call teacher-specific assignment endpoints (e.g., `/api/teacher/assignments`).
  - Student UIs call student endpoints (e.g., `/api/student/assignments`, `/api/student/assignments/:id/submit`).
  - Admin UIs call admin monitoring endpoints to see global assignment and submission data.
- **Attendance and HR**
  - Attendance dashboards and forms call `/api/teacher/*` and `/api/admin/*` attendance endpoints.
  - Payroll and HR views call `/api/admin/*` payroll/payslip/document endpoints.
- **Public landing page**
  - Public marketing sections call `/api/public/faculty` and `/api/public/top-students` to show real data on the homepage.

This document should give you a clear mental map of how the `backend` and `frontend` folders are organized and how they talk to each other. When you open a file, you can refer back here to quickly see where it fits into the overall system.
