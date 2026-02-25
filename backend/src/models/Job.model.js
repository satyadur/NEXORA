import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  
  // Job Details
  jobType: {
    type: String,
    enum: ["Full Time", "Part Time", "Internship", "Contract", "Work from Home"],
    required: true
  },
  location: String,
  salary: String,
  
  // Eligibility Criteria
  eligibleDegrees: [{
    type: String,
    enum: [
      "B.Sc", "M.Sc", "B.Tech", "M.Tech", "BCA", "MCA", 
      "B.Com", "M.Com", "BA", "MA", "BBA", "MBA", "PhD", "Diploma"
    ]
  }],
  eligibleSpecializations: [{
    type: String,
    enum: [
      "Computer Science", "Information Technology", "Mathematics", "Physics", 
      "Chemistry", "Biology", "Electronics", "Electrical", "Mechanical", 
      "Civil", "Commerce", "Economics", "English", "Hindi", "Business Administration",
      "Data Science", "Artificial Intelligence", "Machine Learning", "Cybersecurity",
      "Cloud Computing", "Web Development", "Mobile Development"
    ]
  }],
  eligibleBatches: [String], // e.g., ["2022-2025", "2023-2026"]
  minCGPA: Number,
  maxBacklogs: { type: Number, default: 0 },
  requiredSkills: [String],
  experienceRequired: String,
  
  // Important Dates
  postedDate: { type: Date, default: Date.now },
  applicationDeadline: Date,
  testDate: Date,
  interviewDate: Date,
  
  // Company Details
  companyWebsite: String,
  companyLogo: String,
  
  // Application Details
  applicationLink: String,
  applicationProcess: String,
  
  // Status
  status: {
    type: String,
    enum: ["Active", "Expired", "Filled", "Draft"],
    default: "Active"
  },
  
  // Who posted this job (Admin/Teacher)
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  // Statistics
  totalApplications: { type: Number, default: 0 },
  shortlistedCount: { type: Number, default: 0 },
  selectedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);