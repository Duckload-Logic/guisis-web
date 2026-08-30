import {
  Activity,
  BookOpen,
  HeartPulse,
  MessageSquare,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { TabId } from "../../constants";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "personal", label: "I. Personal Information", icon: User },
  { id: "education", label: "II. Educational Background", icon: BookOpen },
  { id: "family", label: "III. Family Background", icon: Users },
  { id: "health", label: "IV. Health", icon: HeartPulse },
  { id: "interests", label: "V. Interests & Hobbies", icon: Trophy },
  { id: "testResults", label: "VI. Test Results", icon: Activity },
  {
    id: "significantNotes",
    label: "VII. Significant Notes",
    icon: MessageSquare,
  },
];

export default function InfoNavigation({
  activeTab,
  setActiveTab,
  showSignificantNotes = true,
  isExpedited = false,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  showSignificantNotes?: boolean;
  isExpedited?: boolean;
}) {
  const filteredTabs = showSignificantNotes
    ? TABS
    : TABS.filter((tab) => tab.id !== "significantNotes");

  return (
    <div className="relative z-20 sm:-mb-[2px]">
      <nav
        className={cn(
          "no-scrollbar ml-0 flex w-full items-center gap-2 pb-2 sm:items-end sm:gap-1 sm:pb-0",
          "overflow-x-auto overflow-y-hidden sm:ml-4",
          "xl:w-auto xl:overflow-visible",
        )}
      >
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isTabDisabled = isExpedited && tab.id !== "personal";

          return (
            <button
              key={tab.id}
              disabled={isTabDisabled}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative shrink-0 whitespace-nowrap",
                "px-4 py-2.5 text-xs font-bold transition-all duration-300 sm:px-6 sm:py-3 sm:font-medium sm:text-sm",
                // Responsive Shape: Pill on mobile, Tab on desktop
                "rounded-full sm:rounded-none sm:rounded-t-xl sm:border-l-2 sm:border-r-2 sm:border-t-2",
                isActive
                  ? cn(
                      // Active: Solid primary pill on mobile, Card tab on desktop
                      "bg-primary text-primary-foreground shadow-md sm:border-glass-border sm:bg-card sm:text-card-foreground sm:shadow-none",
                    )
                  : cn(
                      // Inactive: Muted pill on mobile, Muted tab on desktop
                      "bg-muted/80 text-muted-foreground hover:bg-muted sm:border-transparent sm:bg-muted sm:opacity-70",
                    ),
                isTabDisabled &&
                  "pointer-events-none cursor-not-allowed bg-neutral-200/50 opacity-30 dark:bg-neutral-800/50",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center transition-colors",
                  isActive ? "gap-2" : "gap-0"
                )}
              >
                <tab.icon
                  className={cn(
                    "shrink-0 transition-all duration-300",
                    isActive
                      ? "scale-110 sm:text-primary"
                      : "opacity-60 group-hover:text-secondary group-hover:opacity-100",
                  )}
                  size={16}
                />

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isActive
                      ? "grid-cols-[1fr] opacity-100"
                      : "grid-cols-[0fr] opacity-0"
                  }`}
                >
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap text-[11px]",
                      "sm:text-sm",
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
