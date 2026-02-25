// types/admin.ts
export interface AdminStats {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalClassrooms: number;
    totalAssignments: number;
    activeClassrooms: number;
    pendingClassrooms: number;
    publishedAssignments: number;
    draftAssignments: number;
  };
  
  growth: {
    newUsersThisMonth: number;
    newSubmissionsThisMonth: number;
    newAssignmentsThisMonth: number;
    activeUsersLast7Days: number;
  };
  
  performance: {
    totalSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    submissionRate: number;
    onTimeRate: number;
    lateSubmissions: number;
  };
  
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  
  utilization: {
    classroomUtilizationRate: number;
    avgClassSize: number;
    totalEnrolledStudents: number;
    avgAssignmentsPerClassroom: number;
  };
  
  teacherAnalytics: {
    avgClassroomsPerTeacher: number;
    avgAssignmentsPerTeacher: number;
    totalActiveTeachers: number;
    teacherEffectiveness: number;
  };
  
  studentAnalytics: {
    avgSubmissionsPerStudent: number;
    studentsWithNoSubmissions: number;
    avgAttendanceRate: number;
    atRiskStudents: number;
  };
  
  platformHealth: {
    engagementScore: number;
    performanceGrade: string;
    recommendations: string[];
  };
}

export interface MonthlyGrowthItem {
  month: number;
  students: number;
  teachers: number;
  classrooms: number;
  assignments: number;
  submissions: number;
  engagementRate?: number;
  completionRate?: number;
}