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
        "relative mt-5 overflow-hidden rounded-[26px]",
        "bg-muted/30 p-4 shadow-sm",
        "sm:p-6",
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div
        className={cn(
          "animate-fade-in-up flex flex-col gap-4",
          "md:flex-row md:items-end md:justify-between",
        )}
        style={{ animationDelay: "0.13s", animationFillMode: "both" }}
      >
        <div className="min-w-0 space-y-2">
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
            "w-fit shrink-0 rounded-xl border border-border bg-background/80 px-3.5 py-2",
            "text-xs text-muted-foreground shadow-sm backdrop-blur-md",
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
              "group relative min-h-[132px] overflow-hidden rounded-xl border border-border bg-background p-4",
              "shadow-sm transition-all duration-300",
              "hover:-translate-y-1 hover:border-primary/40 hover:shadow-md",
              "animate-fade-in-up",
            )}
            style={{
              animationDelay: `${0.05 * (index + 1)}s`,
              animationFillMode: "both",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex h-full min-w-0 items-start gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                  "border border-border/50 bg-gradient-to-br shadow-sm",
                  "transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 group-hover:shadow-md",
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

                <h3 className="text-base font-semibold leading-6 text-foreground transition-colors group-hover:text-primary">
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
