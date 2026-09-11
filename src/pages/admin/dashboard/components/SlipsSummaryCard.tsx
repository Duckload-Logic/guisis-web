import { Clock, CheckCircle2, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SlipsSummaryCardProps {
  isLoading: boolean;
  pendingCount: number;
  approvedCount: number;
  onManage: () => void;
}

export function SlipsSummaryCard({
  isLoading,
  pendingCount,
  approvedCount,
  onManage,
}: SlipsSummaryCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-glass-border",
        "shadow-xs bg-card/60 backdrop-blur-xl",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between border-b",
          "border-glass-border bg-muted/20 px-5 py-3.5",
        )}
      >
        <CardTitle className="text-sm font-bold text-foreground">
          Admission Slip Queue
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onManage}
          className="h-7 px-2 text-xs font-semibold text-primary"
        >
          Manage
        </Button>
      </CardHeader>

      <CardContent className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "flex flex-col justify-between rounded-xl border",
                "border-warning-foreground/30 p-3.5",
                "bg-warning-background text-warning-foreground",
                "shadow-xs",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                  )}
                >
                  Pending
                </span>
                <Clock className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {pendingCount.toLocaleString()}
              </p>
            </div>

            <div
              className={cn(
                "flex flex-col justify-between rounded-xl border",
                "border-success-foreground/30 p-3.5",
                "bg-success-background text-success-foreground",
                "shadow-xs",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                  )}
                >
                  Approved
                </span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {approvedCount.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={onManage}
          className={cn(
            "mt-4 h-10 w-full gap-2 rounded-xl bg-primary",
            "font-semibold text-primary-foreground shadow-sm",
            "hover:bg-primary/90",
          )}
        >
          <Eye className="h-4 w-4" />
          Review Slips Queue
        </Button>
      </CardContent>
    </Card>
  );
}
