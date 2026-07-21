import { AlertCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IIRFormNavigationProps {
  currentSection: number;
  currentIndex: number;
  totalSections: number;
  isSaving: boolean;
  isSubmitting: boolean;
  isEditMode: boolean;
  isNextBlocked?: boolean;
  nextBlockedMessage?: string;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function IIRFormNavigation({
  currentSection,
  currentIndex,
  totalSections,
  isSaving,
  isSubmitting,
  isEditMode,
  isNextBlocked = false,
  nextBlockedMessage,
  onReset,
  onPrevious,
  onNext,
  onSubmit,
}: IIRFormNavigationProps) {
  const hasNextSection = currentIndex < totalSections - 1;
  const shouldDisableNext = isSaving || isNextBlocked;

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 flex",
        "flex-col items-center justify-between gap-4 rounded-xl",
        "border border-glass-border bg-glass-bg p-5",
        "shadow-md",
        "delay-500 duration-700 md:flex-row",
      )}
    >
      <div className="flex w-full flex-col gap-3 md:w-auto">
        <Button
          variant="ghost"
          onClick={onReset}
          className={cn(
            "w-fit rounded-xl px-4 font-bold text-neutral-400 transition-all",
            "duration-300 hover:bg-destructive/10 hover:text-destructive",
            "sm:px-6",
          )}
        >
          Reset Section
        </Button>

        {isNextBlocked && nextBlockedMessage && (
          <div
            className={cn(
              "inline-flex max-w-xl items-start gap-2 rounded-xl border px-3 py-2",
              "border-amber-500/25 bg-amber-500/10 text-xs font-medium text-amber-700",
              "shadow-sm dark:text-amber-200",
            )}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{nextBlockedMessage}</span>
          </div>
        )}
      </div>

      <div className="flex w-full min-w-0 gap-3 sm:w-auto">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentSection === 1 || isSaving}
          className={cn(
            "flex h-12 min-w-0 items-center gap-2 rounded-2xl",
            "border-neutral-200/50 bg-white/30 px-5 font-bold",
            "text-neutral-700 shadow-sm transition-all duration-300",
            "hover:bg-white/60 dark:border-white/10 dark:bg-white/5",
            "dark:text-neutral-200 dark:hover:bg-white/10 sm:px-7",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {hasNextSection ? (
          <Button
            onClick={onNext}
            disabled={shouldDisableNext}
            aria-disabled={shouldDisableNext}
            title={isNextBlocked ? nextBlockedMessage : "Next Step"}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 sm:flex-none",
              "font-black tracking-tight text-primary-foreground shadow-xl",
              "shadow-primary/20 transition-all duration-300",
              "hover:bg-primary/90 active:scale-95 sm:px-10",
              isNextBlocked &&
                "cursor-not-allowed bg-muted text-muted-foreground shadow-none hover:bg-muted active:scale-100",
            )}
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "border-3 h-5 w-5 animate-spin rounded-full",
                    "border-primary-foreground border-t-transparent",
                  )}
                />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary sm:flex-none",
              "px-6 tracking-tight",
              "text-primary-foreground shadow-xl shadow-primary/20",
              "transition-all duration-300 hover:bg-primary/90",
              "active:scale-95 sm:px-10",
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "border-3 h-5 w-5 animate-spin rounded-full",
                    "border-primary-foreground border-t-transparent",
                  )}
                />
                <span>Submitting...</span>
              </div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditMode ? "Save Changes" : "Complete Profile"}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
