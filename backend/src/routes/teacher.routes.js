import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

/* ===== GENERAL TEACHER CONTROLLER ===== */
import {
  getTeacherDashboard,
  getMyClassrooms,
  getClassroomDetails,
  getClassroomAnalytics,
  getTeacherAnalytics,
  getClassroomStudents,
} from "../controllers/teacher.controller.js";

/* ===== ASSIGNMENT CONTROLLER ===== */
import {
  createAssignment,
  getMyAssignments,
  getAssignmentDetails,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  evaluateSubmission,
  getSubmissionDetails,
  getAllSubmissions,
  markAttendanceForClassroom,
  getAttendanceByDate,
  getAttendanceHistory as getClassroomAttendanceHistory,
  getStudentAttendance,
} from "../controllers/teacher.assignment.controller.js";

/* ===== ATTENDANCE CONTROLLER ===== */
import {
  checkIn,
  checkOut,
  createGeofence,
  generateAttendanceQR,
  getAttendanceAnalytics,
  getLiveLocation,
  getAttendanceHistory,
} from "../controllers/teacher.attendance.controller.js";

const router = express.Router();

/* =====================================================
   🔹 DASHBOARD
===================================================== */

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getTeacherDashboard
);

router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getTeacherAnalytics
);

/* =====================================================
   🔹 CLASSROOMS
===================================================== */

router.get(
  "/classrooms",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getMyClassrooms
);

router.get(
  "/classrooms/:id",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getClassroomDetails
);

router.get(
  "/classrooms/:id/analytics",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getClassroomAnalytics
);

router.get(
  "/classrooms/:id/students",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getClassroomStudents
);

/* =====================================================
   🔹 ASSIGNMENTS (Handled by teacher.assignment.controller)
===================================================== */

router.post(
  "/assignments",
  authMiddleware,
  roleMiddleware("TEACHER"),
  createAssignment
);

router.get(
  "/assignments",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getMyAssignments
);

router.get(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getAssignmentDetails
);

router.put(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("TEACHER"),
  updateAssignment
);

router.patch(
  "/assignments/:id/publish",
  authMiddleware,
  roleMiddleware("TEACHER"),
  publishAssignment
);

router.delete(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("TEACHER"),
  deleteAssignment
);

/* =====================================================
   🔹 SUBMISSIONS (Assignment Related)
===================================================== */

router.get(
  "/assignments/:id/submissions",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getAssignmentSubmissions
);

router.patch(
  "/submissions/:id/evaluate",
  authMiddleware,
  roleMiddleware("TEACHER"),
  evaluateSubmission
);

router.get(
  "/submissions",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getAllSubmissions
);

router.get(
  "/submissions/:id",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getSubmissionDetails
);

/* =====================================================
   🔹 CLASSROOM ATTENDANCE (Student attendance)
===================================================== */

router.post(
  "/classrooms/:id/attendance",
  authMiddleware,
  roleMiddleware("TEACHER"),
  markAttendanceForClassroom
);

router.get(
  "/classrooms/:id/attendance",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getAttendanceByDate
);

router.get(
  "/classrooms/:id/attendance/history",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getClassroomAttendanceHistory
);

router.get(
  "/classrooms/:id/students/:studentId/attendance",
  authMiddleware,
  roleMiddleware("TEACHER"),
  getStudentAttendance
);

/* =====================================================
   🔹 TEACHER ATTENDANCE (Teacher's own attendance with location)
===================================================== */

// Check-in with location
router.post(
  "/attendance/checkin",
  authMiddleware,
  roleMiddleware("TEACHER", "FACULTY_ADMIN"),
  checkIn
);

// Check-out with location
router.post(
  "/attendance/checkout",
  authMiddleware,
  roleMiddleware("TEACHER", "FACULTY_ADMIN"),
  checkOut
);

// Generate QR code for attendance
router.post(
  "/attendance/generate-qr",
  authMiddleware,
  roleMiddleware("TEACHER", "FACULTY_ADMIN"),
  generateAttendanceQR
);

// Get today's attendance for current user
router.get(
  "/attendance/today",
  authMiddleware,
  roleMiddleware("TEACHER", "FACULTY_ADMIN"),
  async (req, res) => {
    // You can create a separate controller for this or use getAttendanceHistory with date filter
    const { getTodayAttendance } = await import("../controllers/teacher.attendance.controller.js");
    return getTodayAttendance(req, res);
  }
);

// Get attendance history for current user (without parameter)
router.get(
  "/attendance/history",
  authMiddleware,
  roleMiddleware("TEACHER", "FACULTY_ADMIN", "ADMIN"),
  getAttendanceHistory
);

// Get attendance history for specific employee (with employeeId parameter)
router.get(
  "/attendance/history/:employeeId",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  getAttendanceHistory
);

// Get live location of checked-in employee
router.get(
  "/attendance/live/:employeeId",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  getLiveLocation
);

// Create geofence (admin only)
router.post(
  "/attendance/geofence",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createGeofence
);

// Get attendance analytics
router.get(
  "/attendance/analytics",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  getAttendanceAnalytics
);

export default router;