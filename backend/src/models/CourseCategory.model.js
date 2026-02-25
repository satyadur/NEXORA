// models/CourseCategory.model.js
import mongoose from "mongoose";

const courseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  image: String,
  
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseCategory",
  },
  
  // Hierarchy
  level: { type: Number, default: 1 },
  path: String, // e.g., "engineering/cse/programming"
  
  // Statistics
  totalCourses: { type: Number, default: 0 },
  popularCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  }],
  
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Auto-generate slug from name
courseCategorySchema.pre("save", function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export default mongoose.model("CourseCategory", courseCategorySchema);