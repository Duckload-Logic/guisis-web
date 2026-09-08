import { useState, useEffect } from "react";
import {
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MACRO_STAGES,
  getStageForSection,
  MacroStage,
} from "@/pages/student/iir/config/iirFormSections";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentStage = getStageForSection(currentSection);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(
    currentStage.id,
  );

  useEffect(() => {
    setExpandedStageId(currentStage.id);
  }, [currentStage.id]);

  const isSectionFinished = (id: number) => {
    const hasError = sectionsWithErrors.includes(id);
    const completionPercent = calculateCompletion ? calculateCompletion(id) : 0;
    return !hasError && completionPercent === 100;
  };

  const isNavigable = (id: number) => {
    if (id === currentSection) return true;
    const sectionIndex = sections.findIndex((s) => s.id === id);
    const currentIndex = sections.findIndex((s) => s.id === currentSection);
    if (sectionIndex < currentIndex && visitedSections.includes(id)) {
      return true;
    }
    for (const prev of sections.slice(0, sectionIndex)) {
      if (!isSectionFinished(prev.id)) return false;
    }
    return true;
  };

  const isStageFinished = (stage: MacroStage) => {
    return stage.sectionIds.every((id) => isSectionFinished(id));
  };

  const isStageNavigable = (stage: MacroStage) => {
    return stage.sectionIds.some((id) => isNavigable(id));
  };

  const getStageCompletedCount = (stage: MacroStage) => {
    return stage.sectionIds.filter((id) => isSectionFinished(id)).length;
  };

  const handleSubStepClick = (sectionId: number) => {
    if (sectionId === currentSection) return;
    if (isNavigable(sectionId)) {
      setIsMobileMenuOpen(false);
      onNavigate(sectionId);
    }
  };

  const handleStageHeaderClick = (stage: MacroStage) => {
    if (stage.sectionIds.length === 1) {
      handleSubStepClick(stage.sectionIds[0]);
      return;
    }
    setExpandedStageId((prev) => (prev === stage.id ? null : stage.id));
  };

  const currentSectionItem =
    sections.find((s) => s.id === currentSection) || sections[0];
  const currentSubstepIndex =
    currentStage.sectionIds.indexOf(currentSection) + 1;
  const totalSubsteps = currentStage.sectionIds.length;

  const totalCompletedSections = sections.filter((s) =>
    isSectionFinished(s.id),
  ).length;
  const overallProgressPct = Math.round(
    (totalCompletedSections / sections.length) * 100,
  );

  return (
    <div className="select-none">
      <div className="w-full">
        {/* === Mobile View === */}
        <div className="relative py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "flex w-full min-w-0 items-center justify-between rounded-2xl",
              "border border-border bg-card p-4 shadow-sm",
            )}
          >
            <div className="flex flex-col text-left">
              <span
                className={cn(
                  "mb-0.5 text-[10px] font-bold uppercase",
                  "text-muted-foreground",
                )}
              >
                Stage {currentStage.id} of 5 &bull; {currentStage.shortTitle}
              </span>
              <span
                className={cn(
                  "max-w-[240px] truncate text-sm font-bold",
                  "text-foreground",
                )}
              >
                {totalSubsteps > 1
                  ? `${currentSubstepIndex}. ${currentSectionItem.title}`
                  : currentSectionItem.title}
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
                "right-0 top-full z-50 mt-2 max-h-[min(70vh,32rem)]",
                "overflow-y-auto overscroll-contain rounded-2xl border",
                "border-border bg-popover shadow-xl",
              )}
            >
              {MACRO_STAGES.map((stage) => {
                const stageFinished = isStageFinished(stage);
                const stageActive = stage.id === currentStage.id;

                return (
                  <div
                    key={stage.id}
                    className="border-b border-border/50 last:border-b-0"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5",
                        "bg-muted/30 text-[11px] font-bold uppercase",
                        "tracking-wider",
                        stageActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span>
                        Stage {stage.id}: {stage.title}
                      </span>
                      {stageFinished && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      {stage.sectionIds.map((secId, idx) => {
                        const sec = sections.find((s) => s.id === secId);
                        if (!sec) return null;
                        const active = currentSection === secId;
                        const finished = isSectionFinished(secId);
                        const navigable = isNavigable(secId);

                        return (
                          <button
                            key={secId}
                            type="button"
                            disabled={!navigable && !active}
                            onClick={() => handleSubStepClick(secId)}
                            className={cn(
                              "flex w-full items-center justify-between",
                              "px-6 py-3 text-left text-xs transition-colors",
                              active
                                ? "bg-primary/10 font-bold text-primary"
                                : "text-foreground hover:bg-muted/40",
                              !navigable &&
                                !active &&
                                "cursor-not-allowed opacity-40",
                            )}
                          >
                            <span className="truncate">
                              {stage.sectionIds.length > 1
                                ? `${idx + 1}. ${sec.title}`
                                : sec.title}
                            </span>
                            {finished ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : !navigable && !active ? (
                              <Lock className="h-3.5 w-3.5 opacity-40" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* === Desktop 5-Stage Progressive Sidebar === */}
        <div className="hidden lg:block">
          <div
            className={cn(
              "sticky top-24 flex flex-col gap-5 rounded-2xl border",
              "border-border bg-card/60 p-5 shadow-xl backdrop-blur-2xl",
            )}
          >
            {/* Header with Stage Progress */}
            <div className="flex flex-col gap-1.5 px-1">
              <div className="flex items-center justify-between">
                <h2
                  className={cn(
                    "text-[10px] uppercase tracking-[0.25em]",
                    "font-bold text-primary",
                  )}
                >
                  IIR Wizard Progress
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {overallProgressPct}%
                </span>
              </div>
              <div
                className={cn(
                  "h-1.5 w-full overflow-hidden rounded-full bg-muted/80",
                )}
              >
                <div
                  className={cn(
                    "h-full bg-primary transition-all duration-500",
                    "rounded-full",
                  )}
                  style={{ width: `${overallProgressPct}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/70">
                Stage {currentStage.id} of 5 &bull;{" "}
                {totalCompletedSections} of {sections.length} steps done
              </span>
            </div>

            {/* 5 Macro Stages Accordion */}
            <nav className="flex flex-col gap-2">
              {MACRO_STAGES.map((stage) => {
                const isActive = stage.id === currentStage.id;
                const isExpanded = expandedStageId === stage.id || isActive;
                const isFinished = isStageFinished(stage);
                const hasError = stage.sectionIds.some((id) =>
                  sectionsWithErrors.includes(id),
                );
                const isClickable = isStageNavigable(stage) || isFinished;
                const completedCount = getStageCompletedCount(stage);
                const hasMultipleSubsteps = stage.sectionIds.length > 1;

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "rounded-xl border transition-all duration-300",
                      isActive
                        ? "border-primary/40 bg-card shadow-md shadow-primary/5"
                        : isFinished
                          ? "border-emerald-500/20 bg-muted/20"
                          : "border-border/60 bg-muted/10 opacity-75",
                      !isClickable && !isActive && "opacity-50",
                    )}
                  >
                    {/* Stage Header Button */}
                    <button
                      type="button"
                      onClick={() => handleStageHeaderClick(stage)}
                      disabled={!isClickable && !isActive}
                      className={cn(
                        "flex w-full items-center justify-between p-3",
                        "text-left transition-colors",
                        isClickable || isActive
                          ? "cursor-pointer hover:bg-muted/40"
                          : "cursor-not-allowed",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Stage Badge */}
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center",
                            "justify-center rounded-lg border text-[11px]",
                            "font-black transition-all duration-300",
                            isActive
                              ? "border-primary bg-primary text-white"
                              : isFinished
                                ? "border-emerald-600 bg-emerald-600" +
                                  " text-white"
                                : hasError
                                  ? "border-destructive bg-destructive" +
                                    " text-white"
                                  : "border-border bg-muted/80" +
                                    " text-muted-foreground",
                          )}
                        >
                          {isFinished ? (
                            <Check
                              className="h-4 w-4"
                              strokeWidth={3}
                            />
                          ) : hasError ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            stage.id
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="flex min-w-0 flex-col">
                          <span
                            className={cn(
                              "truncate text-[12px] font-bold tracking-tight",
                              isActive
                                ? "font-extrabold text-foreground"
                                : isFinished
                                  ? "text-foreground/90"
                                  : "text-muted-foreground",
                            )}
                          >
                            {stage.title}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {isFinished
                              ? "Completed"
                              : isActive
                                ? hasMultipleSubsteps
                                  ? `Step ${currentSubstepIndex} of ` +
                                    `${totalSubsteps}`
                                  : "In Progress"
                                : hasMultipleSubsteps
                                  ? `${completedCount}/` +
                                    `${stage.sectionIds.length} done`
                                  : "Upcoming"}
                          </span>
                        </div>
                      </div>

                      {/* Right Indicator */}
                      <div className="ml-2 shrink-0">
                        {hasMultipleSubsteps ? (
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground",
                              "transition-transform duration-200",
                              isExpanded && "rotate-90",
                            )}
                          />
                        ) : !isClickable && !isActive ? (
                          <Lock className="h-3 w-3 text-muted-foreground/60" />
                        ) : null}
                      </div>
                    </button>

                    {/* Sub-steps disclosure */}
                    {hasMultipleSubsteps && isExpanded && (
                      <div
                        className={cn(
                          "flex flex-col gap-1 border-t border-border/40",
                          "bg-muted/10 px-2.5 py-2",
                        )}
                      >
                        {stage.sectionIds.map((secId, subIdx) => {
                          const sec = sections.find((s) => s.id === secId);
                          if (!sec) return null;
                          const isSubActive = currentSection === secId;
                          const isSubFinished = isSectionFinished(secId);
                          const isSubNavigable = isNavigable(secId);
                          const isSubError = sectionsWithErrors.includes(secId);

                          return (
                            <button
                              key={secId}
                              type="button"
                              disabled={!isSubNavigable && !isSubActive}
                              onClick={() => handleSubStepClick(secId)}
                              className={cn(
                                "flex items-center justify-between rounded-lg",
                                "px-2.5 py-1.5 text-left text-[11px]",
                                "transition-colors",
                                isSubActive
                                  ? "bg-primary/10 font-bold text-primary"
                                  : isSubNavigable
                                    ? "text-muted-foreground " +
                                      "hover:bg-muted/50 hover:text-foreground"
                                    : "cursor-not-allowed opacity-40 " +
                                      "text-muted-foreground",
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 shrink-0 items-center",
                                    "justify-center rounded-full text-[9px]",
                                    "font-bold",
                                    isSubActive
                                      ? "bg-primary text-white"
                                      : isSubFinished
                                        ? "bg-emerald-600/20 text-emerald-600"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {subIdx + 1}
                                </span>
                                <span className="truncate">{sec.title}</span>
                              </div>

                              {isSubFinished ? (
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-emerald-600",
                                  )}
                                  strokeWidth={3}
                                />
                              ) : isSubError ? (
                                <AlertCircle
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-destructive",
                                  )}
                                />
                              ) : !isSubNavigable && !isSubActive ? (
                                <Lock className="h-3 w-3 shrink-0 opacity-40" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Auto-saved info */}
            {lastSaved && (
              <div
                className={cn(
                  "mt-1 flex items-center gap-2 rounded-xl",
                  "bg-muted/40 px-3 py-2 text-[9px] text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500",
                  )}
                />
                <span>Last saved: {lastSaved}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
