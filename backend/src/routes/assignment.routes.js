import express from "express";
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
} from "../controllers/assignment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "TEACHER"),
  createAssignment
);

router.get("/", authMiddleware, getAllAssignments);
router.get("/:id", authMiddleware, getAssignmentById);

export default router;
