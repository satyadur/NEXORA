// models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Generate unique ID for students (with course code)
const generateStudentUniqueId = (courseCode) => {
  const prefix = "NX";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const coursePrefix = courseCode
    ? courseCode.slice(0, 3).toUpperCase()
    : "GEN";
  return `${prefix}${year}${coursePrefix}${random}`;
};

// Generate unique ID for employees (teachers, faculty admins)
const generateEmployeeUniqueId = (role, name) => {
  const prefix = role === "TEACHER" ? "TCH" : "FAC";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const nameInitials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `${prefix}${year}${nameInitials}${random}`;
};

// Generate unique ID for admins
const generateAdminUniqueId = () => {
  const prefix = "ADM";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}${year}${random}`;
};

// Education Schema
const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    specialization: { type: String, required: true },
    university: String,
    yearOfPassing: Number,
    percentage: Number,
    isCompleted: { type: Boolean, default: true },
    documents: [
      {
        type: {
          type: String,
          enum: ["CERTIFICATE", "MARK_SHEET", "TRANSCRIPT"],
        },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false },
);

// Work Experience Schema
const experienceSchema = new mongoose.Schema(
  {
    company: String,
    position: String,
    duration: String,
    description: String,
    isCurrent: { type: Boolean, default: false },
    documents: [
      {
        type: {
          type: String,
          enum: ["OFFER_LETTER", "EXPERIENCE_LETTER", "PAYSLIP"],
        },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false },
);

// Skills Schema
const skillSchema = new mongoose.Schema(
  {
    name: String,
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    certificates: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        url: String,
      },
    ],
  },
  { _id: false },
);

// Address Schema
const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: "India" },
    pincode: String,
  },
  { _id: false },
);

// Social Links Schema
const socialLinksSchema = new mongoose.Schema(
  {
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
  },
  { _id: false },
);

// Job Preferences Schema (for students)
const jobPreferencesSchema = new mongoose.Schema(
  {
    preferredRoles: [String],
    preferredLocations: [String],
    expectedSalary: String,
    jobType: {
      type: [String],
      enum: [
        "Full Time",
        "Part Time",
        "Internship",
        "Work from Home",
        "Contract",
      ],
    },
    immediateJoiner: { type: Boolean, default: false },
    noticePeriod: String,
  },
  { _id: false },
);

// Student Academic Records Schema
const academicRecordSchema = new mongoose.Schema(
  {
    semester: Number,
    subjects: [
      {
        name: String,
        code: String,
        credits: Number,
        grade: String,
        marks: Number,
      },
    ],
    sgpa: Number,
    cgpa: Number,
    backlogs: Number,
    certificate: {
      url: String,
      issuedDate: Date,
    },
  },
  { _id: false },
);

// Certificate Schema (for achievements, assignments, etc.)
const certificateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "ASSIGNMENT",
        "COURSE_COMPLETION",
        "ACHIEVEMENT",
        "INTERNSHIP",
        "PLACEMENT",
      ],
    },
    title: String,
    description: String,
    issueDate: Date,
    expiryDate: Date,
    url: String,
    qrCode: String,
    metadata: {
      assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
      score: Number,
      grade: String,
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Employee Record Schema (for teachers and faculty)
const employeeRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, sparse: true },
    designation: {
      type: String,
      enum: [
        "Professor",
        "Associate Professor",
        "Assistant Professor",
        "Lecturer",
        "Guest Faculty",
        "Faculty Admin",
      ],
    },
    department: String,
    joiningDate: Date,
    contractType: {
      type: String,
      enum: ["PERMANENT", "CONTRACT", "VISITING", "PROBATION"],
    },
    qualifications: [
      {
        degree: String,
        specialization: String,
        university: String,
        year: Number,
        certificate: String,
      },
    ],

    // Salary Information
    salary: {
      basic: Number,
      hra: Number,
      da: Number,
      ta: Number,
      pf: Number,
      tax: Number,
      netSalary: Number,
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
        bankName: String,
      },
    },

    // Documents
    documents: {
      offerLetter: { url: String, uploadedAt: Date },
      appointmentLetter: { url: String, uploadedAt: Date },
      experienceLetter: { url: String, uploadedAt: Date },
      relievingLetter: { url: String, uploadedAt: Date },
      panCard: { url: String, number: String },
      aadharCard: { url: String, number: String },
      photo: { url: String },
      signature: { url: String },
    },

    // Leave Records
    leaves: {
      total: { type: Number, default: 0 },
      taken: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
      records: [
        {
          type: { type: String, enum: ["CASUAL", "SICK", "EARNED", "OTHER"] },
          fromDate: Date,
          toDate: Date,
          days: Number,
          reason: String,
          status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"] },
          approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
    },

    // Performance Reviews
    performanceReviews: [
      {
        reviewDate: Date,
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: Number,
        comments: String,
        nextReviewDate: Date,
      },
    ],

    // 👇 ADD SHIFT TIMINGS HERE (right after performanceReviews)
    shiftTimings: {
      start: { type: String, default: "09:00" }, // "09:00"
      end: { type: String, default: "17:00" }, // "17:00"
      gracePeriod: { type: Number, default: 15 }, // minutes
      workingHours: { type: Number, default: 8 }, // hours
    },
  },
  { _id: false },
);

// Student Course Enrollment Schema (for tracking enrolled courses)
const studentCourseSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    courseCode: String,
    courseName: String,
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["enrolled", "in_progress", "completed", "dropped"],
      default: "enrolled",
    },
    grade: String,
    percentage: Number,
    completionDate: Date,
    certificateIssued: { type: Boolean, default: false },
  },
  { _id: false },
);

// QR Code Schema for public profile access
const qrCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uniqueId: { type: String, required: true, unique: true },
  qrData: { type: String, required: true },
  qrImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  accessCount: { type: Number, default: 0 },
  lastAccessed: Date,
  accessLogs: [
    {
      timestamp: Date,
      ip: String,
      userAgent: String,
      referrer: String,
      location: {
        country: String,
        city: String,
      },
    },
  ],
});

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    // Role
    role: {
      type: String,
      enum: ["ADMIN", "FACULTY_ADMIN", "TEACHER", "STUDENT"],
      default: "STUDENT",
    },

    // Unique ID (generated based on role)
    uniqueId: { type: String, unique: true, sparse: true },

    avatar: { type: String, default: "" },

    // Personal Details
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    aadharNumber: { type: String, unique: true, sparse: true },
    panNumber: { type: String, unique: true, sparse: true },

    address: addressSchema,

    // Professional Info
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [skillSchema],

    // Student specific
    enrollmentNumber: String,
    batch: String,
    currentSemester: String,
    cgpa: Number,
    backlogs: { type: Number, default: 0 },

    // Courses the student is enrolled in
    enrolledCourses: [studentCourseSchema],

    // Academic Records (for students)
    academicRecords: [academicRecordSchema],

    // Certificates (for students)
    certificates: [certificateSchema],

    // Job related
    resume: String,
    jobPreferences: jobPreferencesSchema,
    socialLinks: socialLinksSchema,

    // Teacher/Faculty Admin specific
    employeeRecord: {
      type: employeeRecordSchema,
      required: function () {
        return this.role === "TEACHER" || this.role === "FACULTY_ADMIN";
      },
    },

    // For eligibility checking
    isProfileComplete: { type: Boolean, default: false },
    isPlacementEligible: { type: Boolean, default: false },
    placementStatus: {
      type: String,
      enum: [
        "Not Applied",
        "Applied",
        "Shortlisted",
        "Selected",
        "Placed",
        "Not Eligible",
      ],
      default: "Not Applied",
    },

    // Activity tracking
    lastActive: Date,
    isActive: { type: Boolean, default: true },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

/* 🔐 Hash Password and Generate Unique ID before saving */
userSchema.pre("save", async function (next) {
  try {
    // Hash password if modified
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Generate unique ID based on role if not exists
    if (!this.uniqueId) {
      switch (this.role) {
        case "STUDENT":
          // For students, you might want to pass a default course code
          // This could be updated later when they enroll in a course
          this.uniqueId = generateStudentUniqueId("GEN");
          break;
        case "TEACHER":
        case "FACULTY_ADMIN":
          this.uniqueId = generateEmployeeUniqueId(this.role, this.name);
          break;
        case "ADMIN":
          this.uniqueId = generateAdminUniqueId();
          break;
        default:
          this.uniqueId = generateEmployeeUniqueId("TCH", this.name);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

/* 🔍 Check if student is eligible for a job */
userSchema.methods.isEligibleForJob = function (job) {
  if (this.role !== "STUDENT") return false;

  // Check education eligibility
  const hasMatchingEducation = this.education.some((edu) => {
    return (
      job.eligibleDegrees?.includes(edu.degree) &&
      job.eligibleSpecializations?.includes(edu.specialization)
    );
  });

  if (!hasMatchingEducation) return false;

  // Check CGPA eligibility
  if (job.minCGPA && this.cgpa < job.minCGPA) return false;

  // Check backlog eligibility
  if (job.maxBacklogs !== undefined && this.backlogs > job.maxBacklogs)
    return false;

  // Check batch eligibility
  if (job.eligibleBatches && !job.eligibleBatches.includes(this.batch))
    return false;

  // Check skills match
  if (job.requiredSkills?.length > 0) {
    const userSkillNames = this.skills.map((s) => s.name);
    const hasRequiredSkills = job.requiredSkills.every((skill) =>
      userSkillNames.includes(skill),
    );
    if (!hasRequiredSkills) return false;
  }

  return true;
};

/* 🔐 Compare password */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/* 📋 Get public profile for QR code access */
userSchema.methods.getPublicProfile = function () {
  return {
    name: this.name,
    uniqueId: this.uniqueId,
    enrollmentNumber: this.enrollmentNumber,
    batch: this.batch,
    cgpa: this.cgpa,
    education: this.education,
    certificates: this.certificates?.filter((c) => c.isPublic),
    skills: this.skills,
    placementStatus: this.placementStatus,
    isPlacementEligible: this.isPlacementEligible,
  };
};

/* 📋 Get employee summary (for payroll and HR) */
userSchema.methods.getEmployeeSummary = function () {
  if (this.role !== "TEACHER" && this.role !== "FACULTY_ADMIN") {
    return null;
  }

  return {
    name: this.name,
    email: this.email,
    employeeId: this.employeeRecord?.employeeId,
    department: this.employeeRecord?.department,
    designation: this.employeeRecord?.designation,
    joiningDate: this.employeeRecord?.joiningDate,
    salary: this.employeeRecord?.salary,
    bankAccount: this.employeeRecord?.salary?.bankAccount,
    leaves: this.employeeRecord?.leaves,
  };
};

/* 📋 Get student enrolled courses */
userSchema.methods.getEnrolledCourses = function () {
  if (this.role !== "STUDENT") return [];
  return this.enrolledCourses || [];
};

/* 📋 Enroll student in a course */
userSchema.methods.enrollInCourse = function (course, courseCode, courseName) {
  if (this.role !== "STUDENT") {
    throw new Error("Only students can enroll in courses");
  }

  // Check if already enrolled
  const alreadyEnrolled = this.enrolledCourses.some(
    (c) => c.courseId.toString() === course._id.toString(),
  );

  if (alreadyEnrolled) {
    throw new Error("Already enrolled in this course");
  }

  this.enrolledCourses.push({
    courseId: course._id,
    courseCode: course.code || courseCode,
    courseName: course.title || courseName,
    enrollmentDate: new Date(),
    status: "enrolled",
  });

  return this;
};

// Indexes
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ "enrolledCourses.courseId": 1 });
userSchema.index({ "enrolledCourses.status": 1 });

// Export models
export const QRCode = mongoose.model("QRCode", qrCodeSchema);
export default mongoose.model("User", userSchema);
