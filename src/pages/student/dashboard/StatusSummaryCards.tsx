import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { StudentStatCard } from "./types";

interface StatusSummaryCardsProps {
  statCards: StudentStatCard[];
}

export function StatusSummaryCards({ statCards }: StatusSummaryCardsProps) {
  return (
    <section
      aria-label="Student dashboard status summary"
      className={cn(
        "grid w-full grid-cols-1 gap-3",
        "min-[520px]:grid-cols-2",
        "xl:grid-cols-4",
      )}
    >
      {statCards.map((item, index) => {
        const cardContent = (
          <Card
            className={cn(
              "group overflow-hidden rounded-xl border border-glass-border",
              "bg-glass-bg shadow-md backdrop-blur-xl transition-all duration-300",
              "hover:-translate-y-0.5",
              item.href &&
                "cursor-pointer hover:border-primary/30 hover:bg-glass-bg/60",
              "animate-fade-in-up",
            )}
            style={{
              animationDelay: `${0.05 * (index + 1)}s`,
              animationFillMode: "both",
            }}
          >
            <CardContent className="p-4">
              <div className="flex min-h-[92px] items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    title={item.title}
                    className={cn(
                      "truncate text-[11px] font-semibold uppercase leading-4",
                      "tracking-[0.14em] text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </p>

                  <p
                    className={cn(
                      "mt-3 truncate text-3xl font-bold leading-none",
                      "tracking-tight text-foreground",
                    )}
                  >
                    {item.value}
                  </p>

                  <p className="mt-3 truncate text-xs leading-4 text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    "shadow-md backdrop-blur-md transition-transform duration-200",
                    "group-hover:scale-105",
                    item.iconWrap,
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );

        if (item.href) {
          return (
            <Link
              key={item.title}
              to={item.href}
              className="block no-underline outline-none"
            >
              {cardContent}
            </Link>
          );
        }

        return <div key={item.title}>{cardContent}</div>;
      })}
    </section>
  );
}
