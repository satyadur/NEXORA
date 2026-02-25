import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

import {
  getStudentDashboard,
  getMyAssignments,
  getAssignmentDetailsForStudent,
  submitAssignment,
  getMySubmissions,
  getSubmissionDetails,
  getAvailableClassrooms,
  joinClassroom,
  getMyJoinedClassrooms,
  getStudentClassroomDetails,
} from "../controllers/student.controller.js";

const router = express.Router();

/* ================= DASHBOARD ================= */

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getStudentDashboard
);

/* ================= ASSIGNMENTS ================= */

router.get(
  "/assignments",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getMyAssignments
);

router.get(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getAssignmentDetailsForStudent
);

router.post(
  "/assignments/:id/submit",
  authMiddleware,
  roleMiddleware("STUDENT"),
  submitAssignment
);

/* ================= SUBMISSIONS ================= */

router.get(
  "/submissions",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getMySubmissions
);

router.get(
  "/submissions/:id",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getSubmissionDetails
);

router.get(
  "/classrooms",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getAvailableClassrooms
);

router.post(
  "/classrooms/join",
  authMiddleware,
  roleMiddleware("STUDENT"),
  joinClassroom
);
router.get(
  "/classrooms/joined",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getMyJoinedClassrooms
);

router.get(
  "/classrooms/:id",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getStudentClassroomDetails
);

export default router;
