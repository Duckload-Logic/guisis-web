import React from "react";
import {
  Home,
  Shield,
  Server,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  User,
  GraduationCap,
  Activity,
  Code,
  BookOpen,
  ClipboardList,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}
const ICON_SIZE = "1.25rem";

export const NAV_CONFIG: Record<string, NavItem[]> = {
  student: [
    {
      label: "Dashboard",
      href: "/student",
      icon: <Home size={ICON_SIZE} />,
    },
    {
      label: "Appointments",
      href: "/student/appointments",
      icon: <Calendar size={ICON_SIZE} />,
    },
    {
      label: "Admission Slips",
      href: "/student/slips",
      icon: <FileText size={ICON_SIZE} />,
    },
    {
      label: "IIR Profile",
      href: "/student/iir",
      icon: <User size={ICON_SIZE} />,
    },
    {
      label: "COR Management",
      href: "/student/cor-management",

      icon: <ClipboardList size={ICON_SIZE} />,
    },
  ],
  admin: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <Home size={ICON_SIZE} />,
    },
    {
      label: "Student Records",
      href: "/admin/student-records",
      icon: <Users size={ICON_SIZE} />,
    },
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: <Calendar size={ICON_SIZE} />,
    },
    {
      label: "Admission Slips",
      href: "/admin/slips",
      icon: <FileText size={ICON_SIZE} />,
    },
    {
      label: "Reports & Analytics",
      href: "/admin/analytics",
      icon: <TrendingUp size={ICON_SIZE} />,
    },
    {
      label: "Academic Settings",
      href: "/admin/academic-settings",
      icon: <GraduationCap size={ICON_SIZE} />,
    },
    // {
    //   label: "Records Lifecycle",
    //   href: "/admin/lifecycle",
    //   icon: <GraduationCap size={ICON_SIZE} />,
    // },
  ],
  superadmin: [
    {
      label: "Dashboard",
      href: "/superadmin",
      icon: <Home size={ICON_SIZE} />,
    },
    {
      label: "M2M Management",
      href: "/superadmin/m2m-management",
      icon: <Server size={ICON_SIZE} />,
    },
    {
      label: "User Management",
      href: "/superadmin/users",
      icon: <Users size={ICON_SIZE} />,
    },
    {
      label: "System Analytics",
      href: "/superadmin/analytics",
      icon: <TrendingUp size={ICON_SIZE} />,
    },
    {
      label: "Audit Logs",
      href: "/superadmin/audit-logs",
      icon: <FileText size={ICON_SIZE} />,
    },
    {
      label: "Security Logs",
      href: "/superadmin/security-logs",
      icon: <Shield size={ICON_SIZE} />,
    },
    {
      label: "System Logs",
      href: "/superadmin/system-logs",
      icon: <Activity size={ICON_SIZE} />,
    },
  ],
  developer: [
    {
      label: "Developer Hub",
      href: "/developer",
      icon: <Code size={ICON_SIZE} />,
    },
    {
      label: "API Documentation",
      href: "/developer/docs",
      icon: <BookOpen size={ICON_SIZE} />,
    },
    {
      label: "Dev Guides",
      href: "/developer/guides",
      icon: <FileText size={ICON_SIZE} />,
    },
  ],
};
