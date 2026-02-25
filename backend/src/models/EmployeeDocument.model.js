// models/EmployeeDocument.model.js
import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  documentType: {
    type: String,
    enum: [
      "OFFER_LETTER",
      "APPOINTMENT_LETTER",
      "EXPERIENCE_LETTER",
      "RELIEVING_LETTER",
      "PAYSLIP",
      "PAN_CARD",
      "AADHAR_CARD",
      "QUALIFICATION_CERTIFICATE",
      "TRAINING_CERTIFICATE",
      "ACHIEVEMENT_CERTIFICATE",
      "CONTRACT"
    ],
    required: true
  },
  
  title: String,
  description: String,
  
  fileUrl: { type: String, required: true },
  fileType: String,
  fileSize: Number,
  
  issueDate: Date,
  expiryDate: Date,
  
  // For experience letters, offer letters etc.
  metadata: {
    position: String,
    department: String,
    joiningDate: Date,
    relievingDate: Date,
    salary: Number,
    reason: String
  },
  
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("EmployeeDocument", employeeDocumentSchema);