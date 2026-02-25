import { SidebarData } from "@/types/sidebar";
import {
  IconDashboard,
  IconBook2,
  IconClipboardList,
  IconChartBar,
  IconSchool,
  IconArrowsJoin,
} from "@tabler/icons-react";
import { BadgeCheck } from "lucide-react";

export const studentData: SidebarData = {
  user: {
    name: "Student",
    email: "student@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/student",
      icon: IconDashboard,
    },

    {
      title: "My Classrooms",
      url: "/student/classrooms",
      icon: IconSchool,
    },
// join-classroom
{
      title: "Join Classroom",
      url: "/student/join-classrooms",
      icon:IconArrowsJoin,
    },
    {
      title: "My Assignments",
      url: "/student/assignments",
      icon: IconBook2,
    },

    {
      title: "My Submissions",
      url: "/student/submissions",
      icon: IconClipboardList,
    },

    {
      title: "Performance Analytics",
      url: "/student/analytics",
      icon: IconChartBar,
    },
    {
      title: "Profile",
      url: "/student/profile",
      icon: BadgeCheck,
    },
  ],
};
