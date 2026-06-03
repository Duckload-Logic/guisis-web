import { useState, useEffect } from "react";
import { Check, AlertCircle, ChevronDown, Lock } from "lucide-react";
import { useToast } from "@/context";
import { cn } from "@/lib/utils";

interface Section {
  id: number;
  title: string;
  key: string;
}

interface SectionProgressProps {
  sections: Section[];
  currentSection: number;
  sectionsWithErrors: number[];
  visitedSections: number[];
  onNavigate: (sectionId: number) => void;
  calculateCompletion?: (sectionId: number) => number;
  lastSaved?: string;
}

export function SectionProgress({
  sections,
  currentSection,
  sectionsWithErrors,
  visitedSections,
  onNavigate,
  calculateCompletion,
  lastSaved,
}: SectionProgressProps) {
  const { triggerToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shakingSection, setShakingSection] = useState<number | null>(null);

  useEffect(() => {
    const styleId = "section-progress-shake";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes subtle-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-subtle-shake {
          animation: subtle-shake 0.3s ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const isSectionFinished = (id: number) => {
    const hasError = sectionsWithErrors.includes(id);
    const completionPercent = calculateCompletion ? calculateCompletion(id) : 0;
    return !hasError && completionPercent === 100;
  };

  const isNavigable = (id: number) => {
    if (id === currentSection) return true;
    if (id < currentSection && visitedSections.includes(id)) return true;
    for (let i = 1; i < id; i++) {
      if (!isSectionFinished(i)) return false;
    }
    return true;
  };

  const handleSectionClick = (id: number) => {
    if (id === currentSection) return;
    if (isNavigable(id)) {
      setIsMobileMenuOpen(false);
      onNavigate(id);
    } else {
      setShakingSection(id);
      triggerToast("Please complete the previous sections first.");
      setTimeout(() => setShakingSection(null), 300);
    }
  };

  const currentSectionItem =
    sections.find((s) => s.id === currentSection) || sections[0];

  return (
    <div className="select-none">
      <div className="w-full">
        {/* === Mobile View === */}
        <div className="relative py-2 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border",
              "border-neutral-200 bg-neutral-100 p-4 shadow-sm",
              "dark:border-neutral-800 dark:bg-neutral-900",
            )}
          >
            <div className="flex flex-col text-left">
              <span className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                Section {currentSection} of {sections.length}
              </span>
              <span className="max-w-[200px] truncate text-sm font-bold text-foreground">
                {currentSectionItem.title.split(". ")[1] ||
                  currentSectionItem.title}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                "duration-300",
                isMobileMenuOpen && "rotate-180",
              )}
            />
          </button>

          {isMobileMenuOpen && (
            <div
              className={cn(
                "animate-in fade-in slide-in-from-top-2 absolute left-0",
                "right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border",
                "border-neutral-200 bg-white shadow-xl dark:border-neutral-800",
                "dark:bg-neutral-900",
              )}
            >
              {sections.map((section, idx) => {
                const active = currentSection === section.id;
                const isCompleted = isSectionFinished(section.id);
                const navigable = isNavigable(section.id);
                const finished = isCompleted && (navigable || active);
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={cn(
                      "flex w-full items-center justify-between p-4",
                      "text-left transition-colors",
                      active
                        ? "bg-primary/5 font-bold text-primary"
                        : cn(
                            "text-muted-foreground hover:bg-neutral-50",
                            "dark:hover:bg-white/5",
                          ),
                      !navigable && !active && "cursor-not-allowed opacity-30",
                    )}
                  >
                    <span className="text-sm">
                      {idx + 1}. {section.title.split(". ")[1] || section.title}
                    </span>
                    {finished ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : !navigable && !active ? (
                      <Lock className="h-3.5 w-3.5 opacity-40" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* === Desktop Professional Vertical Sidebar === */}
        <div className="hidden lg:block">
          <div
            className={cn(
              "sticky top-24 flex flex-col gap-6 rounded-[32px] border",
              "border-white/20 bg-white/40 p-6 shadow-2xl backdrop-blur-2xl",
              "dark:border-white/10 dark:bg-white/[0.04]",
            )}
          >
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-primary">
                IIR Wizard Progress
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 rounded-full bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(visitedSections.length / sections.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60">
                  {visitedSections.length}/{sections.length} Steps
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {sections.map((section, index) => {
                const active = currentSection === section.id;
                const isCompleted = isSectionFinished(section.id);
                const navigable = isNavigable(section.id);
                const finished = isCompleted && (navigable || active);
                const hasError = sectionsWithErrors.includes(section.id);
                const isShaking = shakingSection === section.id;
                const sectionTitle =
                  section.title.split(". ")[1] || section.title;

                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={cn(
                      "group relative flex items-start gap-4 rounded-2xl p-3",
                      "text-left transition-all duration-300",
                      active
                        ? "bg-white shadow-xl shadow-primary/5 dark:bg-white/10"
                        : cn(
                            "hover:bg-white/50 dark:hover:bg-white/5",
                            "opacity-80 hover:opacity-100",
                          ),
                      !navigable && !active && "cursor-not-allowed grayscale",
                      isShaking && "animate-subtle-shake",
                    )}
                  >
                    {/* Vertical Line Connector */}
                    {index !== sections.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-[23px] top-[44px] h-[calc(100%-12px)] w-[2px]",
                          finished
                            ? "bg-green-500/30"
                            : "bg-neutral-200 dark:bg-neutral-800",
                        )}
                      />
                    )}

                    {/* Step Icon/Number */}
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 flex-shrink-0 items-center",
                        "justify-center rounded-xl border-2 text-[12px]",
                        "font-black transition-all duration-300",
                        active
                          ? "scale-110 border-primary bg-primary text-white shadow-lg shadow-primary/30"
                          : finished
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900",
                        !navigable && !active && "opacity-40",
                      )}
                    >
                      {finished ? (
                        <Check
                          className="h-4 w-4"
                          strokeWidth={4}
                        />
                      ) : hasError ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        section.id
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-[12px] font-bold tracking-tight transition-colors",
                          active
                            ? "text-foreground"
                            : finished
                              ? "text-green-600 dark:text-green-500"
                              : "text-muted-foreground",
                          !navigable && !active && "opacity-50",
                        )}
                      >
                        {sectionTitle}
                      </span>
                      {active && (
                        <span className="text-[9px] font-medium uppercase text-primary/70">
                          Current Step
                        </span>
                      )}
                      {!navigable && !active && (
                        <div className="flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5 text-neutral-400" />
                          <span className="text-[9px] font-bold text-neutral-400">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>

                    {active && (
                      <div className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-pulse rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </nav>

            {lastSaved && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                <span className="text-[8px] font-bold text-primary/60">
                  Last auto-saved: {lastSaved}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
