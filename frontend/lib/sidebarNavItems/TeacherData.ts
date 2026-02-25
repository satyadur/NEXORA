import { SidebarData } from "@/types/sidebar";
import {
  IconBook,
  IconDashboard,
  IconFileCheck,
  IconFolder,
  IconChartBar,
  IconCalendarStats,
} from "@tabler/icons-react";
import { BadgeCheck } from "lucide-react";

export const teacherData: SidebarData = {
  user: {
    name: "Teacher",
    email: "teacher@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/teacher",
      icon: IconDashboard,
    },
    {
      title: "Classrooms",
      url: "/teacher/classrooms",
      icon: IconFolder,
    },
    {
      title: "Attendance",
      url: "/teacher/attendance",
      icon: IconCalendarStats,
    },
    {
      title: "Assignments",
      url: "/teacher/assignments",
      icon: IconBook,
      items: [
        {
          title: "All Assignments",
          url: "/teacher/assignments",
        },
        {
          title: "Create Assignment",
          url: "/teacher/assignments/create",
        },
      ],
    },
    {
      title: "Submissions",
      url: "/teacher/submissions",
      icon: IconFileCheck,
    },
    {
      title: "Analytics",
      url: "/teacher/analytics",
      icon: IconChartBar,
    },
    {
      title: "Profile",
      url: "/teacher/profile",
      icon: BadgeCheck,
    },
  ],
};
