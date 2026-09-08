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
              "py-2 border-warning-foreground/30 bg-warning-background text-xs",
              "font-medium text-warning-foreground shadow-sm",
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
            "border-border bg-card/60 px-5 font-bold text-foreground",
            "shadow-sm transition-all duration-300 hover:bg-muted/60 sm:px-7",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
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
              "gap-2 rounded-2xl bg-emerald-600 px-5 font-bold sm:flex-none",
              "tracking-tight text-white shadow-xl shadow-emerald-600/20",
              "transition-all duration-300 hover:bg-emerald-700",
              "active:scale-95 sm:px-7",
            )}
          >
            <div className="flex flex-col items-center leading-tight">
              <span className="text-xs font-bold sm:text-sm">
                Fast-Track Submit
              </span>
              <span
                className="text-[9px] font-normal opacity-90 hidden sm:inline"
              >
                Returning Student
              </span>
            </div>
          </Button>
        )}

        {hasNextSection ? (
          <Button
            onClick={onNext}
            disabled={shouldDisableNext}
            aria-disabled={shouldDisableNext}
            title={isNextBlocked ? nextBlockedMessage : nextLabel}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-2",
              "rounded-2xl bg-primary px-6 font-black tracking-tight",
              "text-primary-foreground shadow-xl shadow-primary/20",
              "transition-all duration-300 hover:bg-primary/90",
              "active:scale-95 sm:flex-none sm:px-8",
              isNextBlocked &&
                "cursor-not-allowed bg-muted text-muted-foreground " +
                  "shadow-none hover:bg-muted active:scale-100",
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
                <span className="max-w-[200px] truncate sm:max-w-none">
                  {nextLabel}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-2",
              "rounded-2xl bg-primary px-6 tracking-tight sm:flex-none",
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
