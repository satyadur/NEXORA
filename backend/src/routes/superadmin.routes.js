import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { secret } = req.body;

    // 1️⃣ Verify secret key
    if (secret !== process.env.INIT_SECRET) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2️⃣ Clear Database
    await mongoose.connection.dropDatabase();

    // 3️⃣ Hash password
    const hashedPassword = "SuperAdmin@123";

    // 4️⃣ Create Super Admin
    const superAdmin = await User.create({
      name: "Super Admin",
      email: "superadmin@nexora.com",
      password: hashedPassword,
      role: "ADMIN",
      phone: "9999999999",
      uniqueId: "SUP" + Date.now()
    });

    return res.status(201).json({
      message: "Super Admin created successfully",
      superAdmin
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Initialization failed",
      error: error.message
    });
  }
});

export default router;