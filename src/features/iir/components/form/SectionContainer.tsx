import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { FormSectionHeader, FormSectionShell } from "./shared";

interface SectionContainerProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function SectionContainer({
  title,
  description,
  icon,
  children,
}: SectionContainerProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 group w-full",
        "duration-700",
      )}
    >
      <FormSectionShell>
        <FormSectionHeader title={title} description={description} icon={icon} />
        <div className="relative">{children}</div>
      </FormSectionShell>
    </div>
  );
}
