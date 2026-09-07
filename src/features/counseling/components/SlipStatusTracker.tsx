import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SlipStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
}

interface SlipStatusTrackerProps {
  stats: SlipStats;
  className?: string;
}

export function SlipStatusTracker({
  stats,
  className,
}: SlipStatusTrackerProps) {
  const items = [
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-warning-foreground",
      bgColor: "bg-warning-background",
      borderColor: "border-warning-foreground/30",
    },
    {
      label: "Approved Today",
      value: stats.approvedToday,
      icon: CheckCircle2,
      color: "text-success-foreground",
      bgColor: "bg-success-background",
      borderColor: "border-success-foreground/30",
    },
  ];

  const navigate = useNavigate();

  return (
    <Card
      className={cn("overflow-hidden shadow-md backdrop-blur-md", className)}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">
          Admission Slip Tracker
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4",
                "transition-all duration-300 hover:shadow-md",
                item.bgColor,
                item.borderColor,
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("rounded-xl shadow-sm", item.color)}>
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {item.label}
                </span>
              </div>

              <div className="text-xl font-semibold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border/50 pt-4">
          <button
            className={cn(
              "w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90",
              "active:scale-95",
            )}
            onClick={() => navigate("/admin/slips")}
          >
            Manage All Slips
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
