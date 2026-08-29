import type { LucideIcon } from "lucide-react";

export interface StudentDashboardAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accent: string;
}

export interface GuidanceService {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

export interface StudentReminder {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface StudentStatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconWrap: string;
  href?: string;
}
