import Classroom from "../models/Classroom.model.js";
import User from "../models/User.model.js";

/* Create Classroom */
export const createClassroom = async (req, res) => {
  try {
    const { name, teacher, status } = req.body;

    const teacherExists = await User.findById(teacher);

    if (!teacherExists || teacherExists.role !== "TEACHER") {
      return res.status(400).json({ message: "Invalid teacher selected" });
    }

    const classroom = await Classroom.create({
      name,
      teacher,
      status: status || "ACTIVE",
    });

    const populated = await classroom.populate("teacher", "name email");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Get All Classrooms */
export const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate("teacher", "name email")
      .populate("students", "name email").sort({ createdAt: -1 });
console.log(classrooms);

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Add Student to Classroom */
export const addStudentToClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    classroom.students.push(req.body.studentId);
    await classroom.save();

    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE CLASSROOM */
export const updateClassroom = async (req, res) => {
  try {
    const { name, teacher, status } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (teacher) {
      const teacherExists = await User.findById(teacher);
      if (!teacherExists || teacherExists.role !== "TEACHER") {
        return res.status(400).json({ message: "Invalid teacher selected" });
      }
      classroom.teacher = teacher;
    }

    if (name) classroom.name = name;
    if (status) classroom.status = status;

    await classroom.save();

    const populated = await classroom.populate("teacher", "name email");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* DELETE CLASSROOM */
export const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({ message: "Classroom deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
