// config/admin-sidebar.ts
import { SidebarData } from "@/types/sidebar";
import {
  IconDashboard,
  IconFolder,
  IconUser,
  IconSchool,
  IconClipboardCheck,
  IconUsersGroup,
  IconMoneybag,
  IconFileText,
  IconCalendarStats,
  IconSettings,
  IconBook,
  IconCertificate,
} from "@tabler/icons-react";

export const adminData: SidebarData = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Courses",
      url: "/admin/courses",
      icon: IconBook,
      items: [
        {
          title: "All Courses",
          url: "/admin/courses",
        },
        {
          title: "Create Course",
          url: "/admin/courses/create",
        },
        {
          title: "Categories",
          url: "/admin/courses/categories",
        },
      ],
    },
    {
      title: "Classrooms",
      url: "/admin/classrooms",
      icon: IconFolder,
    },
    {
      title: "Teachers",
      url: "/admin/teachers",
      icon: IconUser,
      items: [
        {
          title: "All Teachers",
          url: "/admin/teachers",
        },
        {
          title: "Create Teacher",
          url: "/admin/teachers/create",
        },
      ],
    },
    {
      title: "Faculty Admins",
      url: "/admin/faculty-admins",
      icon: IconUsersGroup,
      items: [
        {
          title: "All Faculty Admins",
          url: "/admin/faculty-admins",
        },
        {
          title: "Add New",
          url: "/admin/faculty-admins/create",
        },
      ],
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: IconSchool,
    },
    {
      title: "Assignments",
      url: "/admin/assignments",
      icon: IconClipboardCheck,
    },
    {
      title: "Payroll",
      url: "/admin/payroll",
      icon: IconMoneybag,
      items: [
        {
          title: "Overview",
          url: "/admin/payroll",
        },
        {
          title: "Generate",
          url: "/admin/payroll/generate",
        },
      ],
    },
    // {
    //   title: "Documents",
    //   url: "/admin/documents",
    //   icon: IconFileText,
    // },
    {
      title: "Attendance",
      url: "/admin/attendance",
      icon: IconCalendarStats,
    },
    {
      title: "Certificates",
      url: "/admin/certificates",
      icon: IconCertificate,
    },
  ],
};