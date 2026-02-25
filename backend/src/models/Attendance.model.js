import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      default: "PRESENT",
    },
  },
  { timestamps: true }
);

/* Prevent duplicate attendance per day */
attendanceSchema.index(
  { classroomId: 1, studentId: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
