import { HeartHandshake } from "lucide-react";

import { cn } from "@/lib/utils";

import type { GuidanceService } from "./types";

interface ServicesOfferedSectionProps {
  guidanceServices: GuidanceService[];
}

export function ServicesOfferedSection({
  guidanceServices,
}: ServicesOfferedSectionProps) {
  return (
    <section
      className={cn(
        "mt-5 overflow-hidden rounded-[26px] border border-white/25",
        "bg-white/45 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.065)]",
        "backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]",
        "sm:p-6",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 animate-fade-in-up",
          "md:flex-row md:items-end md:justify-between",
        )}
        style={{ animationDelay: "0.13s", animationFillMode: "both" }}
      >
        <div className="min-w-0 space-y-2">
          <p
            className={cn(
              "inline-flex max-w-full items-center gap-2 rounded-full border",
              "border-primary/15 bg-primary/10 px-3 py-1 text-[11px]",
              "font-semibold uppercase tracking-[0.16em] text-primary",
            )}
          >
            <HeartHandshake className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Guidance Services</span>
          </p>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Services Offered
            </h2>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Student support services available through the Guidance Office.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "w-fit shrink-0 rounded-full border border-white/25 bg-white/55 px-3.5 py-2",
            "text-xs text-muted-foreground shadow-sm backdrop-blur-xl",
            "dark:border-white/10 dark:bg-white/[0.04]",
          )}
        >
          <span className="font-semibold text-foreground">
            {guidanceServices.length}
          </span>{" "}
          services
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {guidanceServices.map((service, index) => (
          <article
            key={service.title}
            className={cn(
              "group min-h-[132px] rounded-[22px] border border-white/25 bg-white/40 p-4",
              "shadow-[0_8px_20px_rgba(15,23,42,0.045)] backdrop-blur-xl",
              "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/55",
              "hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)]",
              "dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]",
              "animate-fade-in-up",
            )}
            style={{
              animationDelay: `${0.05 * (index + 1)}s`,
              animationFillMode: "both",
            }}
          >
            <div className="flex h-full min-w-0 items-start gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                  "border border-white/35 bg-gradient-to-br shadow-sm backdrop-blur-xl",
                  "transition-transform duration-300 group-hover:scale-105",
                  "dark:border-white/10",
                  service.accent,
                )}
              >
                <service.icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.14em]",
                    "text-muted-foreground",
                  )}
                >
                  Service {String(index + 1).padStart(2, "0")}
                </p>

                <h3 className="text-base font-semibold leading-6 text-foreground">
                  {service.title}
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
