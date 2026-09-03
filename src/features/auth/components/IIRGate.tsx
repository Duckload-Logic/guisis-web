import { useAuth } from "@/context";
import { AlertTriangle } from "lucide-react";
import { useIIRStatus } from "@/features/iir/hooks";
import { AnimationStyles } from "@/components/ui/animations";
import { Spinner } from "@/components/shared";
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
  const isCompleted = statusData?.isCompleted ?? false;
  const allowExpeditedIIR = user?.allowExpeditedIIR ?? false;

  const isBlocked = !isSubmitted || (!isCompleted && !allowExpeditedIIR);

  // If student is blocked, render background content with overlay modal
  if (isBlocked && !allowOnGuidancePage) {
    return (
      <div className="relative min-h-screen w-full">
        <AnimationStyles />

        {/* Disabled background content preview */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none select-none blur-sm opacity-40",
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
            "bg-background/80 backdrop-blur-md dark:bg-black/80",
          )}
        >
          <div
            className={cn(
              "animate-fade-in-scale w-full max-w-md overflow-hidden",
              "rounded-2xl border border-glass-border bg-glass-bg p-6",
              "shadow-2xl backdrop-blur-2xl dark:border-white/10",
            )}
          >
            <div
              className={cn(
                "mx-auto mb-4 flex h-14 w-14 items-center justify-center",
                "rounded-2xl border border-amber-500/20 bg-amber-500/10",
                "text-amber-600 dark:text-amber-400 shadow-sm",
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

            <p className="mb-6 text-center text-sm leading-relaxed text-muted-foreground">
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
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default IIRGate;
