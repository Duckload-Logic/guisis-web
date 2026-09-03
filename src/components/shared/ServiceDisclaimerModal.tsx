import {
  HeartHandshake,
  LockKeyhole,
  MapPin,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SafeguardedStudentService } from "@/config/serviceAvailability";
import { cn } from "@/lib/utils";

interface ServiceDisclaimerModalProps {
  open: boolean;
  service: SafeguardedStudentService | null;
  onClose: () => void;
}

const SERVICE_META: Record<
  SafeguardedStudentService,
  { badge: string; title: string }
> = {
  appointments: {
    badge: "Appointment Safeguard",
    title: "Appointment requests are currently unavailable",
  },
  slips: {
    badge: "Admission Slip Safeguard",
    title: "Admission Slip requests are currently unavailable",
  },
};

export default function ServiceDisclaimerModal({
  open,
  service,
  onClose,
}: ServiceDisclaimerModalProps) {
  const serviceMeta = service
    ? SERVICE_META[service]
    : {
        badge: "Service Safeguard",
        title: "Student requests are currently unavailable",
      };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
          "rounded-xl border border-border bg-background p-0 shadow-md",
          "sm:max-w-[600px]",
        )}
        fallbackTitle="Important System Notice"
        fallbackDescription="A safeguard notice for temporarily unavailable student request services."
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
            <DialogHeader className="space-y-4 text-left">
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center",
                    "rounded-xl border border-primary/20 bg-primary/10 text-primary",
                  )}
                >
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border border-primary/20 bg-primary/5",
                      "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]",
                      "text-primary",
                    )}
                  >
                    {serviceMeta.badge}
                  </span>

                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {serviceMeta.title}
                  </DialogTitle>

                  <DialogDescription className="max-w-[500px] text-sm leading-6 text-muted-foreground">
                    Please review this temporary safeguard before continuing.
                  </DialogDescription>
                </div>
              </div>

              <section
                className={cn(
                  "rounded-xl border border-primary/20 bg-primary/5",
                  "px-4 py-4 sm:px-5",
                )}
                aria-label="Important request warning"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center",
                      "rounded-lg bg-primary/10 text-primary",
                    )}
                  >
                    <TriangleAlert
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-5 text-foreground">
                      Please refrain from making requests at this time.
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Do not request an appointment or an admission slip through
                      the system at this time.
                    </p>
                  </div>
                </div>
              </section>
            </DialogHeader>

            <div
              className={cn(
                "mt-4 overflow-hidden rounded-xl border border-border",
                "bg-muted/30 dark:bg-muted/20",
              )}
            >
              <section
                className="flex items-start gap-3.5 px-4 py-4 sm:px-5"
                aria-label="Data privacy notice"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center",
                    "rounded-lg border border-border bg-background text-primary",
                    "shadow-sm",
                  )}
                >
                  <LockKeyhole
                    className="h-[18px] w-[18px]"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Data Privacy Notice
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    To safeguard the confidentiality and safety of the student,
                    please refrain from inputting or submitting any sensitive
                    personal information into this system.
                  </p>
                </div>
              </section>

              <div className="mx-4 border-t border-border sm:mx-5" />

              <section
                className="flex items-start gap-3.5 px-4 py-4 sm:px-5"
                aria-label="Guidance Office direction"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center",
                    "rounded-lg border border-border bg-background text-primary",
                    "shadow-sm",
                  )}
                >
                  <MapPin
                    className="h-[18px] w-[18px]"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    For Inquiries
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    For inquiries, please proceed directly to the Guidance
                    Office.
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-4 flex items-start gap-2.5 px-1 text-muted-foreground">
              <HeartHandshake
                className="mt-0.5 h-4 w-4 shrink-0 text-primary/70"
                aria-hidden="true"
              />
              <p className="text-xs leading-5 sm:text-[13px]">
                The Guidance Office actively promotes and enforces student
                wellness and safety.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 border-t border-border bg-background px-5 py-4",
            "sm:justify-end sm:px-6",
          )}
        >
          <Button
            type="button"
            onClick={onClose}
            className={cn(
              "h-10 w-full rounded-xl bg-primary px-7 text-sm font-semibold",
              "text-primary-foreground shadow-md transition-colors",
              "hover:bg-primary/90 focus-visible:ring-primary sm:w-auto",
            )}
          >
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
