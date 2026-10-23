import { useState } from "react";
import { useAuth } from "@/context";
import { AlertTriangle, Phone, Building2, X } from "lucide-react";
import { useIIRStatus } from "@/features/iir/hooks";
import { AnimationStyles } from "@/components/ui/animations";
import { Spinner } from "@/components/shared";
import { CRISIS_CONTACTS } from "@/config/constants";
import { cn } from "@/lib/utils";

interface IIRGateProps {
  children: React.ReactNode;
  allowOnGuidancePage?: boolean;
}

/**
 * IIRGate Component
 * Restricts access to student services until PDS form is completed.
 * Renders an un-dismissible modal overlay on top of background content
 * if student has not completed their IIR record.
 */
export const IIRGate = ({
  children,
  allowOnGuidancePage = false,
}: IIRGateProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: statusData, isPending: isIIRPending } = useIIRStatus();
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Multi-role users with 'student' role must still pass the gate
  const roles = user?.roles?.map((r) => r.name.toLowerCase()) || [];
  const isStudent = roles.includes("student");

  // While auth or IIR status is being determined, show loading
  if (isAuthLoading || (isStudent && isIIRPending)) {
    return (
      <Spinner
        size="lg"
        message="Verifying your profile..."
      />
    );
  }

  // Non-students bypass the gate logic
  if (!isStudent) {
    return <>{children}</>;
  }

  const isSubmitted = statusData?.isSubmitted ?? false;
  // Accommodate higher years: Any student who has submitted their
  // IIR (full or expedited) is granted access to all GuiSIS services.
  const isBlocked = !isSubmitted;

  // If student is blocked, render background content with overlay modal
  if (isBlocked && !allowOnGuidancePage) {
    return (
      <div className="relative min-h-screen w-full">
        <AnimationStyles />

        {/* Disabled background content preview */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none select-none opacity-40 blur-sm",
            "transition-all duration-300",
          )}
        >
          {children}
        </div>

        {/* Non-dismissible Modal Overlay */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="iir-gate-modal-title"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "bg-background/80 backdrop-blur-md",
          )}
        >
          <div
            className={cn(
              "animate-fade-in-scale w-full max-w-md overflow-hidden",
              "rounded-2xl border border-glass-border bg-glass-bg p-6",
              "shadow-2xl backdrop-blur-2xl",
            )}
          >
            <div
              className={cn(
                "mx-auto mb-4 flex h-14 w-14 items-center justify-center",
                "rounded-2xl border border-warning-foreground/30",
                "bg-warning-background text-warning-foreground shadow-sm",
              )}
            >
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h2
              id="iir-gate-modal-title"
              className={cn(
                "mb-2 text-center text-xl font-bold tracking-tight",
                "text-foreground",
              )}
            >
              Access Restricted
            </h2>

            <p
              className={cn(
                "mb-6 text-center text-sm leading-relaxed",
                "text-muted-foreground",
              )}
            >
              You must complete your student Individual Inventory Record (IIR)
              form first to access this service.
            </p>

            <a
              href="/student/iir/form"
              className={cn(
                "block w-full rounded-xl bg-primary py-3 text-center",
                "text-sm font-bold text-primary-foreground shadow-md",
                "transition-all duration-200 hover:bg-primary/90",
                "active:scale-95",
              )}
            >
              Go to IIR Form
            </a>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowCrisisModal(true)}
                className={cn(
                  "inline-block text-xs font-semibold text-destructive",
                  "transition-colors hover:text-destructive/80 underline",
                )}
              >
                In Crisis? Request Urgent Guidance Assistance &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Crisis Contact Modal */}
        {showCrisisModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crisis-dialog-title"
            className={cn(
              "fixed inset-0 z-[60] flex items-center justify-center p-4",
              "bg-black/60 backdrop-blur-sm",
            )}
          >
            <div
              className={cn(
                "w-full max-w-md rounded-2xl border border-destructive/30",
                "bg-card p-6 shadow-2xl",
              )}
            >
              <div className="flex items-center justify-between pb-3">
                <span
                  id="crisis-dialog-title"
                  className="font-bold text-destructive text-base"
                >
                  Emergency & Crisis Hotlines
                </span>
                <button
                  type="button"
                  aria-label="Close crisis information"
                  onClick={() => setShowCrisisModal(false)}
                  className={cn(
                    "rounded-lg p-1 text-muted-foreground",
                    "hover:bg-muted transition-colors",
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p
                className={cn(
                  "text-xs text-muted-foreground mb-4 leading-relaxed",
                )}
              >
                If you are experiencing severe distress or crisis, please reach
                out directly:
              </p>

              <div className="space-y-3 text-xs">
                <div
                  className={cn(
                    "rounded-xl border p-3 bg-muted/40 flex gap-3",
                  )}
                >
                  <Phone
                    className="h-4 w-4 text-destructive shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      National Crisis Hotline (NCMH)
                    </p>
                    <p className="text-muted-foreground">
                      {CRISIS_CONTACTS.displayHotline}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl border p-3 bg-muted/40 flex gap-3",
                  )}
                >
                  <Building2
                    className="h-4 w-4 text-destructive shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      PUP Taguig Guidance Office
                    </p>
                    <p className="text-muted-foreground">
                      {CRISIS_CONTACTS.guidanceOfficeNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default IIRGate;
