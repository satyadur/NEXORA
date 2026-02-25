// models/StudentCertificate.model.js
import mongoose from "mongoose";
import QRCode from "qrcode";

const studentCertificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  certificateType: {
    type: String,
    enum: [
      "ASSIGNMENT",
      "COURSE_COMPLETION",
      "ACHIEVEMENT",
      "INTERNSHIP",
      "PLACEMENT",
      "PARTICIPATION",
      "MERIT"
    ],
    required: true
  },
  
  title: { type: String, required: true },
  description: String,
  
  // For assignment/course related
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ["Assignment", "Course", "Job"]
  },
  
  score: Number,
  grade: String,
  percentage: Number,
  rank: Number,
  
  issueDate: { type: Date, default: Date.now },
  expiryDate: Date,
  
  certificateUrl: String,
  qrCodeUrl: String,
  qrCodeData: String,
  
  metadata: {
    issuedBy: String,
    organization: String,
    duration: String,
    skills: [String]
  },
  
  isPublic: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  viewCount: { type: Number, default: 0 },
  sharedCount: { type: Number, default: 0 },
  
  downloadedAt: Date
}, { timestamps: true });

// Generate QR code before saving
studentCertificateSchema.pre("save", async function(next) {
  if (!this.qrCodeData) {
    const data = JSON.stringify({
      id: this._id,
      studentId: this.studentId,
      type: this.certificateType,
      title: this.title,
      issueDate: this.issueDate
    });
    
    this.qrCodeData = data;
    this.qrCodeUrl = await QRCode.toDataURL(data);
  }
  next();
});

export default mongoose.model("StudentCertificate", studentCertificateSchema);