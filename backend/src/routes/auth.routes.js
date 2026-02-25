import express from "express";
import { login, register, me, getProfile, updateProfile, getStudentsForJobs } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { parseJsonFields } from "../middlewares/parseJsonFields.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]),
  register
);

router.post("/login", (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json(err.errors);
  }
}, login);

router.get("/me", authMiddleware, me);

router.get("/profile", authMiddleware, getProfile);

router.put(
  "/update",
  authMiddleware,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  updateProfile
);

router.get(
  "/students/eligible", 
  authMiddleware, 
  getStudentsForJobs
);

export default router;
