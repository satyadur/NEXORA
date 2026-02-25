// models/Course.model.js
import mongoose from "mongoose";
import crypto from "crypto";

// Generate unique course code
const generateCourseCode = (department, level, name) => {
  // Get department prefix (first 3 letters)
  const deptPrefix = department.slice(0, 3).toUpperCase();
  
  // Get level prefix (UG/PG/PhD)
  let levelPrefix = "UG";
  if (level === "postgraduate") levelPrefix = "PG";
  if (level === "doctorate") levelPrefix = "PHD";
  if (level === "diploma") levelPrefix = "DIP";
  
  // Get first 2 letters of course name
  const namePrefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  
  // Add random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${deptPrefix}${levelPrefix}${namePrefix}${randomNum}`;
};

// Module Schema (for course modules/units)
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: { type: Number }, // in hours
  order: { type: Number, required: true },
  
  // Learning objectives
  objectives: [String],
  
  // Content
  content: {
    type: { type: String, enum: ["video", "text", "pdf", "quiz", "assignment"] },
    url: String,
    text: String,
    duration: Number, // in minutes
  },
  
  // Resources
  resources: [{
    title: String,
    type: { type: String, enum: ["pdf", "video", "link", "document"] },
    url: String,
  }],
  
  // Quiz/Assignment reference
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'module.assessmentType',
  },
  assessmentType: {
    type: String,
    enum: ['Quiz', 'Assignment'],
  },
  
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Syllabus Schema
const syllabusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  objectives: [String],
  outcomes: [String],
  
  // Weekly/Topic-wise breakdown
  topics: [{
    week: Number,
    title: String,
    description: String,
    duration: Number, // in hours
    materials: [String],
  }],
  
  // Recommended books
  textbooks: [{
    title: String,
    author: String,
    edition: String,
    isbn: String,
    link: String,
  }],
  
  // References
  references: [String],
  
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

// Prerequisites Schema
const prerequisitesSchema = new mongoose.Schema({
  requiredCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  }],
  minimumGrade: { type: String, enum: ["A", "B", "C", "D", "F"] },
  requiredSkills: [String],
  description: String,
}, { _id: false });

// Fee Structure Schema
const feeStructureSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  type: {
    type: String,
    enum: ["one_time", "per_semester", "per_month", "per_year"],
    default: "one_time",
  },
  
  // Installments
  installments: [{
    dueDate: Date,
    amount: Number,
    description: String,
  }],
  
  // Scholarships/Discounts
  discounts: [{
    name: String,
    type: { type: String, enum: ["percentage", "fixed"] },
    value: Number,
    eligibility: String,
  }],
  
  // Additional fees
  additionalFees: [{
    name: String,
    amount: Number,
    isMandatory: { type: Boolean, default: true },
  }],
}, { _id: false });

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Class schedule
  classes: [{
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    startTime: String,
    endTime: String,
    location: String,
    room: String,
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
  
  // Important dates
  importantDates: [{
    title: String,
    date: Date,
    description: String,
  }],
  
  // Exam schedule
  exams: [{
    title: String,
    date: Date,
    duration: Number, // in minutes
    location: String,
    weightage: Number, // percentage
  }],
}, { _id: false });

// Enrollment Stats Schema
const enrollmentStatsSchema = new mongoose.Schema({
  totalEnrolled: { type: Number, default: 0 },
  currentEnrolled: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  droppedCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
}, { _id: false });

// Main Course Schema
const courseSchema = new mongoose.Schema({
  // Basic Information
  title: { type: String, required: true },
  code: { 
    type: String, 
    required: true, 
    unique: true, // This creates an index automatically - NO NEED FOR ADDITIONAL INDEX
    default: function() {
      return generateCourseCode(this.department, this.level, this.title);
    }
  },
  shortCode: { type: String, unique: true, sparse: true }, // e.g., CS101
  
  description: { type: String, required: true },
  longDescription: String,
  
  // Category & Level
  department: { 
    type: String, 
    required: true,
    enum: [
      "Computer Science", "Information Technology", "Mathematics", "Physics",
      "Chemistry", "Biology", "Electronics", "Electrical", "Mechanical",
      "Civil", "Commerce", "Economics", "English", "Hindi", "Business Administration"
    ]
  },
  level: {
    type: String,
    enum: ["undergraduate", "postgraduate", "doctorate", "diploma", "certificate"],
    required: true,
  },
  
  // Credits & Duration
  credits: { type: Number, required: true, min: 1 },
  duration: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ["weeks", "months", "semesters", "years"], default: "semesters" },
  },
  
  // Course Details
  syllabus: syllabusSchema,
  prerequisites: prerequisitesSchema,
  modules: [moduleSchema],
  
  // Instructors
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  headInstructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  // Delivery Mode
  deliveryMode: {
    type: [String],
    enum: ["online", "offline", "hybrid", "recorded"],
    default: ["offline"],
  },
  
  // Fee Structure
  fee: feeStructureSchema,
  
  // Schedule
  schedule: scheduleSchema,
  
  // Enrollment
  enrollmentStats: { type: enrollmentStatsSchema, default: () => ({}) },
  maxStudents: Number,
  minStudents: Number,
  
  // Status
  status: {
    type: String,
    enum: ["draft", "published", "archived", "upcoming", "ongoing", "completed"],
    default: "draft",
  },
  
  // Tags & Categories
  tags: [String],
  category: String,
  
  // Learning Outcomes
  learningOutcomes: [String],
  
  // Skills you'll gain
  skillsGained: [String],
  
  // Career opportunities
  careerOpportunities: [String],
  
  // Certifications
  certificateTemplate: {
    type: String,
    enum: ["standard", "premium", "custom"],
    default: "standard",
  },
  certificateIssued: { type: Boolean, default: true },
  
  // Media
  thumbnail: String,
  previewVideo: String,
  brochure: String,
  
  // Ratings & Reviews
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: { type: Date, default: Date.now },
  }],
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Version control
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    data: Object,
    updatedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ❌ REMOVED DUPLICATE INDEX - The unique: true in field definitions already creates indexes
// No need for this additional index:
// courseSchema.index({ code: 1 });

// Keep these compound indexes for better query performance
courseSchema.index({ department: 1, level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ instructors: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for formatted course code
courseSchema.virtual("formattedCode").get(function() {
  return `${this.code} - ${this.title}`;
});

// Virtual for current enrollment
courseSchema.virtual("enrollmentStatus").get(function() {
  if (!this.maxStudents) return "unlimited";
  const percentage = (this.enrollmentStats?.currentEnrolled / this.maxStudents) * 100;
  return {
    enrolled: this.enrollmentStats?.currentEnrolled || 0,
    max: this.maxStudents,
    percentage: percentage.toFixed(1),
    seatsLeft: this.maxStudents - (this.enrollmentStats?.currentEnrolled || 0),
  };
});

// Virtual for course duration in readable format
courseSchema.virtual("durationFormatted").get(function() {
  return `${this.duration.value} ${this.duration.unit}`;
});

// Pre-save middleware to generate shortCode if not provided
courseSchema.pre("save", async function(next) {
  if (!this.shortCode && this.department && this.level && this.credits) {
    // Generate short code like CS101
    const deptPrefix = this.department.slice(0, 2).toUpperCase();
    const levelNum = this.level === "undergraduate" ? "1" : 
                     this.level === "postgraduate" ? "2" : "3";
    const creditCode = this.credits.toString().padStart(2, '0');
    this.shortCode = `${deptPrefix}${levelNum}${creditCode}`;
  }
  
  // Update version if document modified
  if (!this.isNew && this.isModified()) {
    this.version += 1;
    this.previousVersions.push({
      version: this.version - 1,
      data: this.toObject(),
      updatedAt: new Date(),
      updatedBy: this.updatedBy,
    });
    
    // Keep only last 5 versions
    if (this.previousVersions.length > 5) {
      this.previousVersions = this.previousVersions.slice(-5);
    }
  }
  
  next();
});

// Method to check if course has prerequisites
courseSchema.methods.hasPrerequisites = function() {
  return (this.prerequisites?.requiredCourses?.length > 0) || 
         (this.prerequisites?.requiredSkills?.length > 0);
};

// Method to check if student meets prerequisites
courseSchema.methods.checkPrerequisites = function(student) {
  const unmet = [];
  
  // Check required courses
  if (this.prerequisites?.requiredCourses?.length > 0) {
    // This would need to check student's completed courses
    // For now, just return a placeholder
    return {
      meets: false,
      message: "Prerequisite check requires student's academic history",
    };
  }
  
  // Check required skills
  if (this.prerequisites?.requiredSkills?.length > 0) {
    const studentSkills = student.skills?.map(s => s.name) || [];
    const missingSkills = this.prerequisites.requiredSkills.filter(
      skill => !studentSkills.includes(skill)
    );
    if (missingSkills.length > 0) {
      unmet.push(`Missing skills: ${missingSkills.join(', ')}`);
    }
  }
  
  return {
    meets: unmet.length === 0,
    unmet,
  };
};

// Method to calculate average rating
courseSchema.methods.calculateAverageRating = function() {
  if (!this.ratings || this.ratings.length === 0) {
    return 0;
  }
  
  const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / this.ratings.length;
  
  // Update enrollment stats
  if (this.enrollmentStats) {
    this.enrollmentStats.averageRating = avg;
    this.enrollmentStats.totalReviews = this.ratings.length;
  }
  
  return avg;
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructors: instructorId });
};

// Static method to find courses by department
courseSchema.statics.findByDepartment = function(department, level) {
  const query = { department };
  if (level) query.level = level;
  return this.find(query).sort({ code: 1 });
};

// Static method to get popular courses
courseSchema.statics.getPopularCourses = function(limit = 10) {
  return this.find({ status: "published" })
    .sort({ "enrollmentStats.totalEnrolled": -1 })
    .limit(limit);
};

// Export the model
export default mongoose.model("Course", courseSchema);