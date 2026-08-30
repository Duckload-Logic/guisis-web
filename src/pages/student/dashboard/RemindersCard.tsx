import { SmilePlus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { StudentReminder } from "./types";

interface RemindersCardProps {
  reminders: StudentReminder[];
}

export function RemindersCard({ reminders }: RemindersCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background/80 shadow-sm",
        "backdrop-blur-md",
        "animate-fade-in-up",
      )}
      style={{ animationDelay: "0s", animationFillMode: "both" }}
    >
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.18em]",
                "text-muted-foreground",
              )}
            >
              Reminders
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Student Care Notes
            </h2>
          </div>

          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              "border border-primary/15 bg-primary/10 text-primary",
            )}
          >
            <SmilePlus className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.title}
              className={cn(
                "flex gap-3 rounded-xl border border-border bg-background p-4",
                "border-l-2 border-l-primary/50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:border-l-primary",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "border border-primary/15 bg-primary/10 text-primary",
                )}
              >
                <reminder.icon className="h-4.5 w-4.5" />
              </span>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  {reminder.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {reminder.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
