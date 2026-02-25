// controllers/holiday.controller.js
import TeacherAttendance from '../models/TeacherAttendance.model.js';
import User from '../models/User.model.js';

export const markHoliday = async (req, res) => {
  try {
    const { date, holidayName } = req.body;
    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    // Find all teachers and faculty admins
    const employees = await User.find({
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
    });

    let markedCount = 0;
    for (const employee of employees) {
      // Check if attendance already exists
      const existingAttendance = await TeacherAttendance.findOne({
        employeeId: employee._id,
        date: holidayDate
      });

      if (!existingAttendance) {
        await TeacherAttendance.create({
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeRole: employee.role,
          date: holidayDate,
          dayOfWeek: getDayOfWeek(holidayDate),
          status: "HOLIDAY",
          notes: holidayName || "National Holiday",
          markedBy: employee._id,
          metadata: {
            source: "system",
            verificationMethod: "none"
          }
        });
        markedCount++;
      }
    }

    res.json({
      message: `Marked ${markedCount} employees as HOLIDAY for ${holidayDate.toDateString()}`,
      count: markedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getDayOfWeek(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}