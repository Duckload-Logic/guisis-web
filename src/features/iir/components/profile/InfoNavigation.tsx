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
    <div className="relative z-20 -mb-[2px]">
      <nav
        className={cn(
          "no-scrollbar ml-0 flex w-full items-end gap-1",
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
                "group relative flex-1 whitespace-nowrap border-l-2",
                "border-r-2 border-t-2 px-4 py-3 text-xs font-medium",
                "transition-all duration-300 sm:flex-none sm:px-6",
                "sm:text-sm",
                isActive
                  ? cn(
                      "rounded-t-xl border-glass-border bg-card",
                      "text-card-foreground",
                    )
                  : cn(
                      "z-0 rounded-t-lg border-transparent bg-muted",
                      "text-muted-foreground opacity-70",
                    ),
                isTabDisabled &&
                  "cursor-not-allowed opacity-30 bg-neutral-200/50" +
                    " dark:bg-neutral-800/50 pointer-events-none",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center gap-2 transition-colors",
                  "group-hover:text-secondary",
                )}
              >
                <tab.icon
                  className={cn(
                    "transition-all duration-300 group-hover:text-secondary",
                    isActive
                      ? "scale-110 text-primary"
                      : "opacity-60 group-hover:opacity-100",
                  )}
                  size={18}
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
                      "hidden overflow-hidden whitespace-nowrap text-[10px]",
                      "group-hover:text-secondary sm:block sm:text-sm",
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
