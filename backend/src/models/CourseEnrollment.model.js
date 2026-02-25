// models/CourseEnrollment.model.js
import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  enrollmentDate: { type: Date, default: Date.now },
  
  status: {
    type: String,
    enum: ["enrolled", "in_progress", "completed", "dropped", "failed"],
    default: "enrolled",
  },
  
  // Progress tracking
  progress: {
    modulesCompleted: [{
      moduleId: mongoose.Schema.Types.ObjectId,
      completedAt: Date,
      score: Number,
    }],
    overallProgress: { type: Number, default: 0 }, // percentage
    lastAccessed: Date,
  },
  
  // Grades
  grades: [{
    assessmentId: mongoose.Schema.Types.ObjectId,
    type: { type: String, enum: ["quiz", "assignment", "exam"] },
    score: Number,
    maxScore: Number,
    percentage: Number,
    grade: String,
    submittedAt: Date,
    evaluatedAt: Date,
  }],
  
  // Final result
  finalGrade: String,
  finalPercentage: Number,
  completionDate: Date,
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: String,
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "completed", "refunded"],
    default: "pending",
  },
  paymentDetails: [{
    amount: Number,
    date: Date,
    transactionId: String,
    status: String,
  }],
  
  // Metadata
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin/teacher who enrolled
  notes: String,
  
}, { timestamps: true });

// Ensure unique enrollment per student per course
courseEnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Index for faster queries
courseEnrollmentSchema.index({ studentId: 1, status: 1 });
courseEnrollmentSchema.index({ courseId: 1, status: 1 });

export default mongoose.model("CourseEnrollment", courseEnrollmentSchema);