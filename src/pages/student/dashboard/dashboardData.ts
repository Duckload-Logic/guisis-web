import {
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarPlus,
  ClipboardList,
  FileText,
  GraduationCap,
  HandHeart,
  HelpCircle,
  MessagesSquare,
  ShieldCheck,
  User,
  UserRoundCheck,
} from "lucide-react";

import type {
  GuidanceService,
  StudentDashboardAction,
  StudentReminder,
} from "./types";

export const studentQuickActions: StudentDashboardAction[] = [
  {
    title: "Schedule Appointment",
    description: "Choose an available counseling session",
    icon: CalendarPlus,
    href: "/student/appointments/schedule",
    accent:
      "from-info-foreground/15 to-info-foreground/5 " +
      "text-info-foreground border-info-foreground/20",
  },
  {
    title: "Submit Admission Slip",
    description: "Upload and track your admission slip",
    icon: FileText,
    href: "/student/slips/submit",
    accent:
      "from-success-foreground/15 to-success-foreground/5 " +
      "text-success-foreground border-success-foreground/20",
  },
  {
    title: "My IIR Profile",
    description: "View your personal record",
    icon: User,
    href: "/student/iir",
    accent:
      "from-destructive/15 to-destructive/5 " +
      "text-destructive border-destructive/20",
  },
  {
    title: "Student FAQs",
    description: "Read guides for appointments, slips, and IIR",
    icon: HelpCircle,
    href: "/student/faqs",
    accent:
      "from-warning-foreground/15 to-warning-foreground/5 " +
      "text-warning-foreground border-warning-foreground/20",
  },
];

export const guidanceServices: GuidanceService[] = [
  {
    title: "Individual Counseling",
    description:
      "One-on-one guidance support for personal, emotional, or academic concerns.",
    icon: MessagesSquare,
    accent:
      "from-info-foreground/15 to-info-foreground/5 " +
      "text-info-foreground border-info-foreground/20",
  },
  {
    title: "Group Guidance Sessions",
    description:
      "Student-centered activities and discussions for shared concerns and growth.",
    icon: UserRoundCheck,
    accent:
      "from-notice-foreground/15 to-notice-foreground/5 " +
      "text-notice-foreground border-notice-foreground/20",
  },
  {
    title: "Admission Slip Assistance",
    description:
      "Support for reviewing and processing student admission or excuse slip requests.",
    icon: FileText,
    accent:
      "from-success-foreground/15 to-success-foreground/5 " +
      "text-success-foreground border-success-foreground/20",
  },
  {
    title: "IIR Record Management",
    description:
      "Collection and maintenance of student Individual Inventory Record information.",
    icon: ClipboardList,
    accent:
      "from-destructive/15 to-destructive/5 " +
      "text-destructive border-destructive/20",
  },
  {
    title: "Academic Guidance",
    description:
      "Guidance support for academic adjustment, school concerns, and student progress.",
    icon: GraduationCap,
    accent:
      "from-info-foreground/15 to-info-foreground/5 " +
      "text-info-foreground border-info-foreground/20",
  },
  {
    title: "Career and Wellness Support",
    description:
      "Encouragement for goal-setting, wellness, decision-making, and future planning.",
    icon: BriefcaseBusiness,
    accent:
      "from-warning-foreground/15 to-warning-foreground/5 " +
      "text-warning-foreground border-warning-foreground/20",
  },
];

export const studentReminders: StudentReminder[] = [
  {
    title: "Complete your IIR",
    description: "Keep your student record updated before using major services.",
    icon: BookOpenCheck,
  },
  {
    title: "Check request statuses",
    description: "Review your appointment and slip updates regularly.",
    icon: ShieldCheck,
  },
  {
    title: "Reach out when needed",
    description: "The Guidance Office is here to support your wellbeing.",
    icon: HandHeart,
  },
];
