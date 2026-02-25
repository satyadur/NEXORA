## Dynamic Assignment Maker – Coaching Center Web Platform

Dynamic Assignment Maker is a **full coaching-center management platform**.  
It is designed for institutes that run batches, courses, and tests, and want a **single website** where:

- **Students** get their assignments, submit work, see marks, and track their progress.
- **Teachers** create and evaluate assignments, manage classrooms, and mark attendance.
- **Admins / Owners** see complete institute analytics, manage staff and students, and handle payroll and HR documents.

You can use this README to **explain the project to others** (non-technical people), and use `PROJECT_EXPLANATION.md` for deeper technical details.

---

## What problems does this solve for a coaching center?

- **Scattered information**  
  No more separate WhatsApp groups, Excel sheets, and paper registers. Everything (assignments, attendance, performance, fees-related info) is in one system.

- **No clarity for students**  
  Students can clearly see:
  - Which assignments are pending, submitted, or evaluated.
  - Their marks and performance trends over time.
  - Which classes they are enrolled in and upcoming work.

- **Manual work for teachers**  
  Teachers don’t have to:
  - Manually collect homework in different formats.
  - Maintain separate attendance registers.
  - Manually calculate performance for each student.

- **Limited visibility for management**  
  Admins/owners get:
  - Dashboards for student and teacher performance.
  - Insights into attendance, course performance, and faculty contribution.
  - Basic payroll and HR document management for staff.

---

## Main features (by role)

### For Students

- **Personal dashboard**
  - See overall performance, recent marks, and upcoming assignments.
  - View statistics like completion rates and subject-wise strengths/weaknesses.

- **Assignments**
  - View all active and past assignments given by teachers.
  - Open each assignment to read instructions and due dates.
  - Upload and submit answers directly through the website.
  - Track status: *pending / submitted / evaluated*.

- **Classrooms / Batches**
  - See which classes/batches the student is enrolled in.
  - View important details about each class.

### For Teachers

- **Teacher dashboard**
  - Overview of classes, active assignments, and student performance.
  - Quick statistics like submission rates and average marks.

- **Classroom management**
  - View all classrooms/batches assigned to the teacher.
  - See enrolled students and classroom analytics.

- **Assignment lifecycle**
  - Create new assignments with title, description, due date, and marks.
  - Publish assignments to specific classrooms.
  - View all submissions per assignment.
  - Open each submission, give marks/feedback, and update the status.

- **Attendance**
  - Mark attendance for students in a classroom.
  - Track attendance history and summary for each student.
  - Self-attendance options for teachers (check-in / check-out with support for geofencing/QR logic).

### For Admins / Management

- **Admin dashboard**
  - High-level statistics:
    - Total students, teachers, and active classrooms.
    - Monthly growth and assignment performance.
    - Top-performing students and faculty indicators.

- **User management**
  - Create and manage:
    - Teachers
    - Students
    - Faculty admins or coordinators
  - View detailed profiles and performance analytics.

- **Attendance & performance analytics**
  - Monitor teacher and student attendance.
  - Get summary views and daily snapshots.

- **Payroll & HR**
  - Manage payslips, payroll summaries, and related employee documents.
  - Keep teaching staff records in one place.

- **Public website content**
  - Control public-facing data such as “Top Students” and “Star Faculty” sections displayed on the landing page.

---

## How the website is structured (simple view)

- **Public landing page**
  - Modern coaching-center style homepage with:
    - Hero section (introduction to the institute).
    - Course packages and offerings.
    - Highlighted faculty members.
    - Top students and success stories (powered by real data from the backend).

- **Authentication**
  - Login and register pages for new and existing users.
  - After login, users are automatically sent to their correct dashboard:
    - Admin → `/admin`
    - Teacher → `/teacher`
    - Student → `/student`

- **Role-based sections**
  - `/admin/*` – Admin-only pages.
  - `/teacher/*` – Teacher-only pages.
  - `/student/*` – Student-only pages.
  - If a user is not logged in or has the wrong role, they are redirected appropriately.

---

## Full System Flow & Architecture

This section explains the complete coaching platform flow, matching how the code is structured in both backend and frontend.

### 1. High-level architecture

- **Frontend (Next.js + React Query + ShadCN UI)**
  - Next.js App Router (`frontend/app`).
  - React Query for API calls and caching.
  - ShadCN-style components for modern UI.
  - Axios client configured with `NEXT_PUBLIC_API_URL` and JWT token from cookies.

- **Backend (Express + MongoDB + JWT)**
  - Express app (`backend/src/app.js`) with route modules under `/api/*`.
  - JWT-based authentication and role-based authorization middleware.
  - Mongoose models for users, classrooms, assignments, submissions, attendance, payroll, etc.

- **Request flow**
  - Frontend → Axios (JWT from cookies) → Express API → Auth middleware → Role middleware → Controller → MongoDB models.

### 2. Role-based flow

**User roles**

- `ADMIN`
- `TEACHER`
- `STUDENT`
- (Plus `FACULTY_ADMIN` in the data model, used in admin flows.)

**ADMIN capabilities**

- Create and manage teachers.
- Create and manage students.
- Create and manage classrooms.
- Assign teacher to classroom.
- Add students to classroom.
- View global institute stats and analytics.
- Activate / deactivate classrooms and related entities.

**TEACHER capabilities**

- View only own classrooms.
- Create assignments for own classrooms.
- Publish assignments to students.
- View and evaluate student submissions.
- View assignment performance and classroom analytics.
- Manage attendance for students in their classrooms.

**STUDENT capabilities**

- View enrolled classrooms.
- View published assignments for those classrooms.
- Submit each assignment (typically once per assignment).
- View own submissions and results.

### 3. Classroom system

**Classroom entity (conceptual model)**

- `name` – classroom or batch name.
- `teacher` – reference to a `User` with role `TEACHER`.
- `students[]` – list of `User` references with role `STUDENT`.
- `assignments[]` – assignments linked to this classroom.
- `status` – `ACTIVE` / `INACTIVE`.
- `createdAt` / `updatedAt`.

**Classroom lifecycle**

1. Admin creates a new classroom.
2. Admin assigns a teacher to this classroom.
3. Admin adds students to the classroom.
4. Classroom is marked as `ACTIVE`.
5. Teacher creates assignments for that classroom.
6. Students submit work for those assignments.

### 4. Assignment flow

- Teacher selects one of their classrooms.
- Backend checks:
  - Classroom exists.
  - Classroom is `ACTIVE`.
  - Teacher is the assigned teacher for this classroom.
- Teacher creates an assignment with title, description, deadline, and marks.
- Teacher publishes the assignment (`isPublished = true`).
- Students who are enrolled in that classroom and where classroom is `ACTIVE` see the assignment in their panel.

### 5. Submission flow

- Student opens a published assignment.
- Backend validates:
  - Student belongs to the classroom of that assignment.
  - Classroom is `ACTIVE`.
  - Assignment is published.
  - Student has not already submitted (one submission per student per assignment).
- A `Submission` document is created linking `assignmentId` and `studentId`.
- Teacher later opens submissions list:
  - Evaluates each submission.
  - Stores scores, feedback, and status.

### 6. Authorization flow (backend)

For every protected route on the backend:

1. Request hits an Express route (e.g. `/api/teacher/assignments`).  
2. **Auth middleware**:
   - Reads JWT from `Authorization: Bearer <token>` header.
   - Verifies token and loads the user from MongoDB.
   - Attaches `req.user` (id, role, etc.).
3. **Role middleware**:
   - Checks `req.user.role` against the allowed role(s) for that route.
   - If role is not allowed, returns 403 (forbidden).
4. **Controller logic**:
   - Uses `req.user` to enforce business rules (ownership of classroom, one submission, etc.).
   - Reads/writes data through Mongoose models.

### 7. Data relationships

- **User**
  - Has a `role` (`ADMIN`, `TEACHER`, `STUDENT`, `FACULTY_ADMIN`) and other profile fields.

- **Classroom**
  - `teacher` → `User` (TEACHER).
  - `students[]` → list of `User` (STUDENT).
  - `assignments[]` → list of `Assignment` references.
  - `status` → active/inactive.

- **Assignment**
  - `classroomId` → `Classroom`.
  - `createdBy` → `User` (TEACHER).
  - `isPublished` → boolean.
  - `deadline` and meta fields.

- **Submission**
  - `assignmentId` → `Assignment`.
  - `studentId` → `User` (STUDENT).
  - `answers` / content.
  - `totalScore` and evaluation fields.

Other domain models like attendance, teacher attendance, and payslips extend this with HR and monitoring capabilities.

### 8. Dashboard stats flow

- When an admin opens the dashboard:
  - Frontend calls admin stats APIs using React Query (e.g. `getAdminStats`, `getMonthlyGrowth`).
  - Backend controllers aggregate data from MongoDB using counts and groupings.
  - Results typically include:
    - Total users, students, teachers.
    - Total classrooms, active vs inactive.
    - Total assignments and submissions.
    - Published assignments and submission rates.
    - Overall average scores and trends.
  - Frontend shows this through cards and charts.

### 9. React Query behavior

- **Mutations** (create/update actions):
  - Examples: create classroom, create assignment, submit assignment, evaluate submission.
  - Each mutation has an `onSuccess` handler that calls `invalidateQueries` (e.g. `["classrooms"]`, `["assignments"]`, `["submissions"]`), so the UI automatically refreshes with the latest data.

- **Queries** (data fetching):
  - Dashboards and list pages use `useQuery` with configured `staleTime` and refetch options.
  - Data is refetched when needed (on mount or focus), so manual `useEffect` refresh logic is not required.

### 10. Business rules (production-style)

- **Classrooms**
  - Only admins can create or modify classrooms and assign teachers/students.
  - Classrooms must be `ACTIVE` for assignments to be visible and submissions to be allowed.

- **Assignments**
  - Only the teacher assigned to a classroom can create assignments for that classroom.
  - Students can only see assignments that are published.
  - Students cannot submit an assignment more than once (per assignment per student).

- **Submissions**
  - Only enrolled students can submit for a classroom’s assignment.
  - Submissions are only allowed when classroom is `ACTIVE` and assignment is still valid.

### 11. Overall coaching center flow

- Admin controls the structure of the coaching center (people, classrooms, global analytics, HR).
- Teachers control academic content (assignments, evaluation, classroom‑level attendance and performance).
- Students consume learning content and submit work (assignments, tests, tasks).
- The system strictly enforces rules through backend authorization and controller checks.
- Dashboards on the frontend display real‑time statistics, giving a coaching‑center‑style LMS similar in spirit to platforms like Google Classroom or internal coaching ERPs.

---

## Tech stack (short explanation for non-technical people)

- **Frontend (what users see)**  
  Built using **Next.js** (React-based framework).  
  This gives:
  - Fast, modern user interface.
  - Mobile-friendly, responsive design.
  - Smooth page transitions and animations.

- **Backend (server and database)**  
  Built using:
  - **Node.js + Express** – handles all API requests from the frontend.
  - **MongoDB** – database storing users, assignments, attendance, etc.
  - **JWT authentication** – issues secure tokens after login so the system knows who is logged in.

- **Other services**
  - **Cloudinary** – for storing files like avatars and documents.
  - **Cron jobs** – scheduled background tasks related to attendance/holidays.

If you want the full technical breakdown (routes, models, architecture), see `PROJECT_EXPLANATION.md`.

---

## How to run this project locally (for demo)

> This is a simple guideline you can show to a technical person who will set it up.

### 1. Requirements

- Node.js (LTS version)
- MongoDB (local or cloud)

### 2. Backend setup

- Open the `backend` folder.
- Create and configure a `.env` file (MongoDB URL, JWT secret, Cloudinary keys, etc.).
- Install dependencies:

```bash
cd backend
npm install
```

- (Optional but recommended) Seed demo data:

```bash
npm run seed
```

- Start the backend server:

```bash
npm run dev
```

The backend will start on the port defined in `.env` (for example, `http://localhost:5000`).

### 3. Frontend setup

- Open the `frontend` folder.
- Create a `.env.local` (or similar) file with:
  - `NEXT_PUBLIC_API_URL` pointing to your backend API (for example: `http://localhost:5000/api`).
- Install dependencies:

```bash
cd frontend
npm install
```

- Start the frontend:

```bash
npm run dev
```

- Open the browser at the printed URL (usually `http://localhost:3000`).

You will see the coaching center landing page and can log in using demo accounts created by the seed script.
