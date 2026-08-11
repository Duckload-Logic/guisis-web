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
 * Restricts access to student services until PDS form is completed
 * Only allows access to /student/form (PDS form page)
 * Redirects to /student if PDS is not yet filled
 */
export const IIRGate = ({
  children,
  allowOnGuidancePage = false,
}: IIRGateProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    data: statusData,
    isPending: isIIRPending,
  } = useIIRStatus();

  // Multi-role users with 'student' role must still pass the gate
  const roles = user?.roles?.map((r) => r.name.toLowerCase()) || [];
  const isStudent = roles.includes("student");

  // While auth or IIR status is being determined, show loading
  // For students, we MUST wait for the IIR check to complete
  if (isAuthLoading || (isStudent && isIIRPending)) {
    return (
      <Spinner
        size="lg"
        message="Verifying your profile..."
      />
    );
  }

  // Non-students bypass the rest of the gate logic
  if (!isStudent) {
    return <>{children}</>;
  }

  const isSubmitted = statusData?.isSubmitted ?? false;
  const isCompleted = statusData?.isCompleted ?? false;
  const allowExpeditedIIR = user?.allowExpeditedIIR ?? false;

  const isBlocked = !isSubmitted || (!isCompleted && !allowExpeditedIIR);

  // If PDS is not completed and this is not the form page
  if (isBlocked && !allowOnGuidancePage) {
    return (
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center",
          "w-full min-h-[60vh] p-4",
        )}
      >
        <AnimationStyles />
        <div
          className={cn(
            "animate-fade-in-scale w-full max-w-md rounded-xl border",
            "border-border bg-card p-8 text-card-foreground shadow-xl",
          )}
        >
          <div
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center",
              "rounded-full bg-yellow-100 dark:bg-yellow-900/40",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-6 w-6 text-yellow-600 dark:text-yellow-400",
              )}
            />
          </div>
          <h2
            className={cn(
              "mb-2 text-center text-2xl font-bold text-foreground",
            )}
          >
            Access Restricted
          </h2>
          <p className="mb-6 text-center text-muted-foreground">
            You must complete your student Individual Inventory Record (IIR)
            form first to access this service.
          </p>
          <a
            href="/student/iir/form"
            className={cn(
              "block w-full rounded-lg bg-primary py-3 text-center",
              "font-semibold text-primary-foreground transition-colors",
              "hover:bg-primary/90",
            )}
          >
            Go to IIR Form
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default IIRGate;
