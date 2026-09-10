import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Zap,
} from "lucide-react";

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
  nextSectionTitle?: string;
  showExpressSubmit?: boolean;
  onExpressSubmit?: () => void;
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
  nextSectionTitle,
  showExpressSubmit = false,
  onExpressSubmit,
  onReset,
  onPrevious,
  onNext,
  onSubmit,
}: IIRFormNavigationProps) {
  const hasNextSection = currentIndex < totalSections - 1;
  const shouldDisableNext = isSaving || isNextBlocked;
  const nextLabel = nextSectionTitle
    ? `Next: ${nextSectionTitle}`
    : "Next Step";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 rounded-xl",
        "border border-glass-border bg-glass-bg p-5 shadow-md",
        "md:flex-row",
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
              "inline-flex max-w-xl items-start gap-2 rounded-xl border px-3",
              "border-warning-foreground/30 bg-warning-background py-2",
              "text-xs font-medium text-warning-foreground shadow-sm",
            )}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{nextBlockedMessage}</span>
          </div>
        )}
      </div>

      <div
        className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:gap-3"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentSection === 1 || isSaving}
          aria-label="Go to previous section"
          className={cn(
            "flex h-12 min-w-0 shrink-0 items-center justify-center",
            "gap-2 rounded-2xl border-border bg-card/60 px-3 font-bold",
            "text-foreground shadow-sm transition-all duration-300",
            "hover:bg-muted/60 sm:px-6",
          )}
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {showExpressSubmit && (
          <Button
            type="button"
            id="btn-express-submit"
            onClick={onExpressSubmit}
            disabled={isSaving || isSubmitting}
            title={
              "Submit record using prior semester details " +
              "(Returning Student Fast-Track)"
            }
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center",
              "gap-1.5 rounded-2xl bg-emerald-600 px-3 font-bold",
              "tracking-tight text-white shadow-xl shadow-emerald-600/20",
              "transition-all duration-300 hover:bg-emerald-700",
              "active:scale-95 sm:flex-none sm:gap-2 sm:px-7",
            )}
          >
            <Zap className="h-4 w-4 shrink-0 text-white" />
            <span
              className="whitespace-nowrap text-xs font-bold sm:text-sm"
            >
              Fast-Track<span className="hidden sm:inline"> Submit</span>
            </span>
          </Button>
        )}

        {hasNextSection ? (
          <Button
            onClick={onNext}
            disabled={shouldDisableNext}
            aria-disabled={shouldDisableNext}
            title={isNextBlocked ? nextBlockedMessage : nextLabel}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center",
              "gap-1.5 rounded-2xl bg-primary px-3 font-black",
              "tracking-tight text-primary-foreground shadow-xl",
              "shadow-primary/20 transition-all duration-300",
              "hover:bg-primary/90 active:scale-95 sm:flex-none sm:gap-2",
              "sm:px-8",
              isNextBlocked &&
                "cursor-not-allowed bg-muted text-muted-foreground " +
                  "shadow-none hover:bg-muted active:scale-100",
            )}
          >
            {isSaving ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    "h-4 w-4 animate-spin rounded-full border-2",
                    "border-primary-foreground border-t-transparent",
                    "sm:h-5 sm:w-5 sm:border-3",
                  )}
                />
                <span className="whitespace-nowrap text-xs sm:text-sm">
                  Saving...
                </span>
              </div>
            ) : (
              <>
                <span
                  className={cn(
                    "truncate text-xs font-black sm:text-sm",
                    "max-w-[120px] sm:max-w-none",
                  )}
                >
                  {nextLabel}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center",
              "gap-1.5 rounded-2xl bg-primary px-3 tracking-tight",
              "text-primary-foreground shadow-xl shadow-primary/20",
              "transition-all duration-300 hover:bg-primary/90",
              "active:scale-95 sm:flex-none sm:gap-2 sm:px-10",
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    "h-4 w-4 animate-spin rounded-full border-2",
                    "border-primary-foreground border-t-transparent",
                    "sm:h-5 sm:w-5 sm:border-3",
                  )}
                />
                <span className="whitespace-nowrap text-xs sm:text-sm">
                  Submitting...
                </span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span
                  className="whitespace-nowrap text-xs font-bold sm:text-sm"
                >
                  {isEditMode ? "Save Changes" : "Complete Profile"}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
