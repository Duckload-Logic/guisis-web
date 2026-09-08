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
      aria-label="Guidance Services Directory"
      className={cn(
        "relative mt-8 overflow-hidden rounded-2xl border border-border",
        "bg-muted/20 p-4 shadow-sm sm:p-6",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 animate-fade-in-up",
          "md:flex-row md:items-end md:justify-between",
        )}
        style={{ animationDelay: "0.13s", animationFillMode: "both" }}
      >
        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.18em]",
              "text-muted-foreground",
            )}
          >
            Directory
          </p>

          <h2
            className={cn(
              "text-lg font-semibold tracking-tight text-foreground",
              "sm:text-xl",
            )}
          >
            Services Offered
          </h2>

          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Student support services available through the Guidance Office.
          </p>
        </div>

        <div
          className={cn(
            "w-fit shrink-0 rounded-xl border border-border",
            "bg-background/80 px-3 py-1.5 text-xs text-muted-foreground",
            "shadow-sm backdrop-blur-md",
          )}
        >
          <span className="font-semibold text-foreground">
            {guidanceServices.length}
          </span>{" "}
          services
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {guidanceServices.map((service, index) => (
          <article
            key={service.title}
            className={cn(
              "group relative min-h-[110px] overflow-hidden rounded-xl",
              "border border-border bg-background/90 p-3.5 shadow-sm",
              "transition-all duration-200 animate-fade-in-up",
              "hover:border-primary/30 hover:shadow-sm",
            )}
            style={{
              animationDelay: `${0.04 * (index + 1)}s`,
              animationFillMode: "both",
            }}
          >
            <div
              className="relative z-10 flex h-full min-w-0 items-start gap-3"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center",
                  "rounded-xl border border-border/50 bg-gradient-to-br",
                  "shadow-sm transition-transform duration-200",
                  "group-hover:scale-105",
                  service.accent,
                )}
              >
                <service.icon className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.14em]",
                    "text-muted-foreground",
                  )}
                >
                  Service {String(index + 1).padStart(2, "0")}
                </p>

                <h3
                  className={cn(
                    "text-sm font-semibold leading-5 text-foreground",
                    "transition-colors group-hover:text-primary",
                  )}
                >
                  {service.title}
                </h3>

                <p className="text-xs leading-5 text-muted-foreground">
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
