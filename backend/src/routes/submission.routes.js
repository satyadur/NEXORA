import express from "express";
import {
  submitAssignment,
  getMySubmissions,
} from "../controllers/submission.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitAssignment);
router.get("/me", authMiddleware, getMySubmissions);

export default router;
  