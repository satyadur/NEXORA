import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },

        answer: {
          type: String,
          required: true,
        },

        awardedMarks: {
          type: Number,
          default: 0,
        },

        teacherComment: {
          type: String,
          default: "",
        },

        isCorrect: {
          type: Boolean,
          default: null, // for MCQ auto grading
        },
      },
    ],

    totalScore: {
      type: Number,
      default: 0,
    },

    feedback: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "EVALUATED"],
      default: "SUBMITTED",
    },
  },
  { timestamps: true }
);

/* Prevent duplicate submission */
submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

export default mongoose.model("Submission", submissionSchema);
