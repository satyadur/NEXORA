import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: String,

    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    totalMarks: { type: Number, required: true },

    startTime: Date,
    deadline: { type: Date, required: true },

    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
