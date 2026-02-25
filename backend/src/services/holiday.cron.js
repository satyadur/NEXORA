// services/holiday.cron.js
import cron from 'node-cron';
import TeacherAttendance from '../models/TeacherAttendance.model.js';
import User from '../models/User.model.js';

// Run at 12:00 AM every Sunday
cron.schedule('0 0 * * 0', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if it's Sunday
    if (today.getDay() === 0) { // 0 = Sunday
      
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

        // If no attendance record exists, mark as HOLIDAY
        if (!existingAttendance) {
          await TeacherAttendance.create({
            employeeId: employee._id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            employeeRole: employee.role,
            date: today,
            dayOfWeek: "Sunday",
            status: "HOLIDAY",
            markedBy: employee._id,
            metadata: {
              source: "system",
              verificationMethod: "none"
            }
          });
          
          console.log(`Marked ${employee.name} as HOLIDAY for ${today.toDateString()}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in holiday cron job:', error);
  }
});