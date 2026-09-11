import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AcademicAlertProps {
  isOutdated: boolean;
  currentYearStart?: number;
  currentYearEnd?: number;
  onConfigure: () => void;
}

export function AcademicAlert({
  isOutdated,
  currentYearStart,
  currentYearEnd,
  onConfigure,
}: AcademicAlertProps) {
  if (!isOutdated) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-destructive/30",
        "bg-destructive/10 p-4 backdrop-blur-md transition-all sm:flex-row",
        "sm:items-center sm:justify-between sm:p-5",
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "rounded-xl bg-destructive p-2.5 text-destructive-foreground",
            "shrink-0 shadow-sm",
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-destructive">
            Academic Year Out of Date
          </h4>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
            The current active term ({currentYearStart}&ndash;{currentYearEnd}){" "}
            needs review. Update the school year configuration to maintain valid
            records.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={onConfigure}
        className="shadow-xs h-9 shrink-0 rounded-xl px-4 font-semibold"
      >
        Configure Settings
      </Button>
    </div>
  );
}
