import { ChevronLeft, ChevronRight, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IIRFormNavigationProps {
  currentSection: number;
  currentIndex: number;
  totalSections: number;
  isSaving: boolean;
  isSubmitting: boolean;
  isEditMode: boolean;
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
  onReset,
  onPrevious,
  onNext,
  onSubmit,
}: IIRFormNavigationProps) {
  const hasNextSection = currentIndex < totalSections - 1;

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
      <Button
        variant="ghost"
        onClick={onReset}
        className={cn(
          "rounded-xl px-4 font-bold text-neutral-400 transition-all",
          "duration-300 hover:bg-destructive/10 hover:text-destructive",
          "sm:px-6",
        )}
      >
        Reset Section
      </Button>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentSection === 1 || isSaving}
          className={cn(
            "flex h-12 items-center gap-2 rounded-2xl",
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
            disabled={isSaving}
            className={cn(
              "flex h-12 items-center gap-2 rounded-2xl bg-primary px-6",
              "font-black tracking-tight text-primary-foreground shadow-xl",
              "shadow-primary/20 transition-all duration-300",
              "hover:bg-primary/90 active:scale-95 sm:px-10",
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
              "flex h-12 items-center gap-2 rounded-2xl bg-primary",
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
