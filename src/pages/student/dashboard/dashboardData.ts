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
      "from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  {
    title: "Submit Admission Slip",
    description: "Upload and track your admission slip",
    icon: FileText,
    href: "/student/slips/submit",
    accent:
      "from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    title: "My IIR Profile",
    description: "View your personal record",
    icon: User,
    href: "/student/iir",
    accent:
      "from-rose-500/15 to-red-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    title: "Student FAQs",
    description: "Read guides for appointments, slips, and IIR",
    icon: HelpCircle,
    href: "/student/faqs",
    accent:
      "from-amber-500/15 to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

export const guidanceServices: GuidanceService[] = [
  {
    title: "Individual Counseling",
    description:
      "One-on-one guidance support for personal, emotional, or academic concerns.",
    icon: MessagesSquare,
    accent:
      "from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  {
    title: "Group Guidance Sessions",
    description:
      "Student-centered activities and discussions for shared concerns and growth.",
    icon: UserRoundCheck,
    accent:
      "from-purple-500/15 to-violet-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    title: "Admission Slip Assistance",
    description:
      "Support for reviewing and processing student admission or excuse slip requests.",
    icon: FileText,
    accent:
      "from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    title: "IIR Record Management",
    description:
      "Collection and maintenance of student Individual Inventory Record information.",
    icon: ClipboardList,
    accent:
      "from-rose-500/15 to-red-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    title: "Academic Guidance",
    description:
      "Guidance support for academic adjustment, school concerns, and student progress.",
    icon: GraduationCap,
    accent:
      "from-cyan-500/15 to-teal-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  {
    title: "Career and Wellness Support",
    description:
      "Encouragement for goal-setting, wellness, decision-making, and future planning.",
    icon: BriefcaseBusiness,
    accent:
      "from-amber-500/15 to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
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
