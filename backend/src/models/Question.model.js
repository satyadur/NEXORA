import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional: Add explanation for why this option is correct/incorrect
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true, // Add index for faster queries
    },

    type: {
      type: String,
      enum: ["MCQ", "TEXT", "CODE"],
      required: true,
      index: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [optionSchema],
      default: [],
    },

    correctAnswerIndex: {
      type: Number,
      min: 0,
    },

    marks: {
      type: Number,
      required: true,
      min: 1,
    },

    // New fields for better evaluation
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },

    // For partial marking in MCQ (optional)
    allowPartialMarking: {
      type: Boolean,
      default: false,
    },

    // For coding questions: test cases
    testCases: {
      type: [
        {
          input: String,
          expectedOutput: String,
          marks: Number,
          isHidden: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    // Hints for students (optional)
    hints: {
      type: [String],
      default: [],
    },

    // Solution explanation (visible after evaluation)
    solutionExplanation: {
      type: String,
      default: "",
    },

    // Tags for categorization
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ================= MCQ VALIDATION ================= */
questionSchema.pre("validate", function (next) {
  if (this.type === "MCQ") {
    // Validate options
    if (!this.options || this.options.length < 2) {
      return next(new Error("MCQ must have at least 2 options"));
    }

    // Validate correct answer index
    if (
      this.correctAnswerIndex === undefined ||
      this.correctAnswerIndex === null
    ) {
      return next(new Error("MCQ must have correct answer selected"));
    }

    if (
      this.correctAnswerIndex < 0 ||
      this.correctAnswerIndex >= this.options.length
    ) {
      return next(new Error("Correct answer index is invalid"));
    }

    // Ensure all options have text
    const hasEmptyOption = this.options.some(
      (opt) => !opt.text || opt.text.trim() === "",
    );
    if (hasEmptyOption) {
      return next(new Error("All options must have text"));
    }
  }

  if (this.type === "CODE") {
    // For code questions, validate test cases if provided
    if (this.testCases && this.testCases.length > 0) {
      const totalTestMarks = this.testCases.reduce(
        (sum, tc) => sum + (tc.marks || 0),
        0,
      );
      if (totalTestMarks > this.marks) {
        return next(
          new Error("Total test case marks cannot exceed question marks"),
        );
      }
    }
  }

  next();
});

/* ================= VIRTUAL FIELDS ================= */
// Get correct answer text for MCQ
questionSchema.virtual("correctAnswer").get(function () {
  if (this.type === "MCQ" && this.correctAnswerIndex !== undefined) {
    return this.options[this.correctAnswerIndex]?.text;
  }
  return null;
});

// Check if question has hints
questionSchema.virtual("hasHints").get(function () {
  return this.hints && this.hints.length > 0;
});

// Get total test cases marks for code questions
questionSchema.virtual("totalTestCaseMarks").get(function () {
  if (this.type === "CODE" && this.testCases) {
    return this.testCases.reduce((sum, tc) => sum + (tc.marks || 0), 0);
  }
  return 0;
});

/* ================= INSTANCE METHODS ================= */
// Auto-grade MCQ answer
questionSchema.methods.gradeMCQ = function (studentAnswer) {
  if (this.type !== "MCQ") {
    throw new Error("Can only grade MCQ questions");
  }

  const correctOption = this.options[this.correctAnswerIndex]?.text;
  const isCorrect = correctOption === studentAnswer;

  return {
    isCorrect,
    marks: isCorrect ? this.marks : 0,
  };
};

// Validate if marks are within range
questionSchema.methods.validateMarks = function (awardedMarks) {
  return awardedMarks >= 0 && awardedMarks <= this.marks;
};

// Get suggested marks based on correctness
questionSchema.methods.getSuggestedMarks = function (isCorrect) {
  if (this.type === "MCQ") {
    return isCorrect ? this.marks : 0;
  }
  // For non-MCQ, we can't auto-suggest
  return isCorrect ? this.marks : 0;
};

/* ================= STATIC METHODS ================= */
// Find questions by type
questionSchema.statics.findByType = function (type) {
  return this.find({ type });
};

// Find questions by difficulty
questionSchema.statics.findByDifficulty = function (difficulty) {
  return this.find({ difficulty });
};

/* ================= INDEXES ================= */
// Compound index for faster queries
questionSchema.index({ assignmentId: 1, type: 1 });
questionSchema.index({ createdAt: -1 });

export default mongoose.model("Question", questionSchema);
