// services/attendance.cron.js
import cron from 'node-cron';
import TeacherAttendance from '../models/TeacherAttendance.model.js';
import User from '../models/User.model.js';

// Run at 11:59 PM every day
cron.schedule('59 23 * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all teachers and faculty admins
    const employees = await User.find({
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
    });

    for (const employee of employees) {
      // Check if attendance already exists for today
      const existingAttendance = await TeacherAttendance.findOne({
        employeeId: employee._id,
        date: today
      });

      // If no attendance record exists, mark as ABSENT
      if (!existingAttendance) {
        await TeacherAttendance.create({
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeRole: employee.role,
          date: today,
          dayOfWeek: getDayOfWeek(today),
          status: "ABSENT",
          markedBy: employee._id, // Self-marked by system
          metadata: {
            source: "system",
            verificationMethod: "none"
          }
        });
        
        console.log(`Marked ${employee.name} as ABSENT for ${today.toDateString()}`);
      }
    }
  } catch (error) {
    console.error('Error in attendance cron job:', error);
  }
});

function getDayOfWeek(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}