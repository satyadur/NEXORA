// models/AttendanceQR.model.js
import mongoose from "mongoose";
import crypto from "crypto";

const attendanceQRSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(8).toString("hex").toUpperCase(),
  },
  
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true,
  },
  
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number], // [longitude, latitude]
  },
  
  geofenceRadius: { type: Number, default: 100 }, // in meters
  
  isActive: { type: Boolean, default: true },
  
  usedBy: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usedAt: { type: Date, default: Date.now },
    location: {
      coordinates: [Number],
      accuracy: Number,
    },
  }],
}, { timestamps: true });

attendanceQRSchema.index({ location: "2dsphere" });

export default mongoose.model("AttendanceQR", attendanceQRSchema);