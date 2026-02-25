// models/Payslip.model.js
import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeeId_number: { type: String }, // The custom employee ID like TCH240001
  
  month: {
    type: String,
    required: true,
    enum: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
  },
  year: { type: Number, required: true },
  
  // Earnings
  earnings: {
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
    totalEarnings: { type: Number, required: true },
  },
  
  // Deductions
  deductions: {
    pf: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true },
  },
  
  netSalary: { type: Number, required: true },
  
  // Bank Details (for the payslip)
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  
  // Company/Institute Details
  companyDetails: {
    name: { type: String, default: "Learning Management System" },
    address: String,
    pan: String,
    tan: String,
    gst: String,
  },
  
  // Payment Details
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PROCESSED", "PAID", "FAILED"],
    default: "PROCESSED",
  },
  paymentDate: Date,
  transactionId: String,
  
  // PDF Generation
  pdfUrl: { type: String },
  pdfGeneratedAt: Date,
  
  // Metadata
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  generatedAt: { type: Date, default: Date.now },
  
  notes: String,
  
  // For tracking
  isDownloaded: { type: Boolean, default: false },
  downloadedAt: Date,
  downloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Ensure unique payslip per employee per month/year
payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Virtual for formatted month-year
payslipSchema.virtual("monthYear").get(function() {
  return `${this.month} ${this.year}`;
});

// Virtual for formatted net salary
payslipSchema.virtual("formattedNetSalary").get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.netSalary);
});

export default mongoose.model("Payslip", payslipSchema);