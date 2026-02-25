// models/TeacherAttendance.model.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
  accuracy: Number, // GPS accuracy in meters
  altitude: Number,
  speed: Number,
  heading: Number,
}, { _id: false });

const addressSchema = new mongoose.Schema({
  formattedAddress: String,
  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  placeId: String,
}, { _id: false });

const deviceInfoSchema = new mongoose.Schema({
  deviceId: String,
  deviceType: {
    type: String,
    enum: ["mobile", "tablet", "desktop", "laptop", "other"],
  },
  platform: String, // iOS, Android, Windows, MacOS
  browser: String,
  ipAddress: String,
  userAgent: String,
}, { _id: false });

const attendanceSessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number, // in minutes
  location: locationSchema,
  address: addressSchema,
  deviceInfo: deviceInfoSchema,
  wifiInfo: {
    ssid: String,
    bssid: String,
    signalStrength: Number,
  },
  batteryLevel: Number,
  isWithinGeofence: { type: Boolean, default: false },
  checkInMethod: {
    type: String,
    enum: ["qr_scan", "gps", "manual", "face_recognition", "biometric"],
    default: "gps",
  },
  checkInPhoto: String, // URL to photo taken at check-in
  checkOutPhoto: String, // URL to photo taken at check-out
  notes: String,
}, { _id: false });

const teacherAttendanceSchema = new mongoose.Schema({
  // Employee reference
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeeRole: {
    type: String,
    enum: ["TEACHER", "FACULTY_ADMIN"],
    required: true,
  },
  
  // Date information
  date: { type: Date, required: true, index: true },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  
  // Attendance status
  status: {
    type: String,
    enum: [
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY",
      "ON_LEAVE",
      "WORK_FROM_HOME",
      "ON_DUTY",
      "HOLIDAY",
    ],
    default: "PRESENT",
  },
  
  // Schedule information
  scheduledStartTime: { type: String }, // e.g., "09:00"
  scheduledEndTime: { type: String }, // e.g., "17:00"
  actualCheckIn: attendanceSessionSchema,
  actualCheckOut: attendanceSessionSchema,
  
  // Work hours calculation
  totalWorkHours: { type: Number, default: 0 }, // in hours
  overtime: { type: Number, default: 0 }, // in hours
  lateMinutes: { type: Number, default: 0 },
  earlyDepartureMinutes: { type: Number, default: 0 },
  
  // Attendance sessions (for multiple check-ins/outs in a day)
  sessions: [attendanceSessionSchema],
  
  // Leave reference (if marked as ON_LEAVE)
  leaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User.employeeRecord.leaves.records",
  },
  
  // Marked by
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  markedAt: { type: Date, default: Date.now },
  
  // For geo-fencing
  geofenceZones: [{
    name: String,
    center: locationSchema,
    radius: Number, // in meters
    enteredAt: Date,
    exitedAt: Date,
  }],
  
  // Metadata
 // In your TeacherAttendance model, the metadata should be:
metadata: {
  source: {
    type: String,
    enum: ["qr_scanner", "mobile_app", "web_app", "manual_entry", "system"],
    default: "web_app",
  },
  verificationMethod: {
    type: String,
    enum: ["none", "photo", "face_recognition", "fingerprint", "qr_code"],
    default: "none",
  },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
  },
  
  // Regularization requests
  regularizationRequest: {
    requested: { type: Boolean, default: false },
    requestedStatus: String,
    reason: String,
    supportingDocs: [String],
    requestedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
  
  // Sync status for offline apps
  syncStatus: {
    type: String,
    enum: ["SYNCED", "PENDING", "CONFLICT"],
    default: "SYNCED",
  },
  clientId: String, // For offline apps to track records
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Ensure unique attendance per employee per day
teacherAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for location-based queries
teacherAttendanceSchema.index({ "actualCheckIn.location": "2dsphere" });
teacherAttendanceSchema.index({ "actualCheckOut.location": "2dsphere" });

// Virtual for formatted work hours
teacherAttendanceSchema.virtual("formattedWorkHours").get(function() {
  if (!this.totalWorkHours) return "0h";
  const hours = Math.floor(this.totalWorkHours);
  const minutes = Math.round((this.totalWorkHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Virtual for late status
teacherAttendanceSchema.virtual("isLate").get(function() {
  return this.status === "LATE";
});

// Method to calculate work hours
teacherAttendanceSchema.methods.calculateWorkHours = function() {
  if (this.actualCheckIn && this.actualCheckOut) {
    const diffMs = this.actualCheckOut.startTime - this.actualCheckIn.startTime;
    this.totalWorkHours = diffMs / (1000 * 60 * 60);
  } else if (this.sessions.length > 0) {
    let totalMs = 0;
    this.sessions.forEach(session => {
      if (session.endTime) {
        totalMs += session.endTime - session.startTime;
      }
    });
    this.totalWorkHours = totalMs / (1000 * 60 * 60);
  }
  return this.totalWorkHours;
};

// Pre-save middleware to calculate day of week
teacherAttendanceSchema.pre("save", function(next) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  this.dayOfWeek = days[this.date.getDay()];
  next();
});

export default mongoose.model("TeacherAttendance", teacherAttendanceSchema);