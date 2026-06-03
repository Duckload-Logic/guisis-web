import { Navigate } from "react-router-dom";
import { useAuth } from "@/context";
import { Spinner } from "@/components/shared";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Protected Route Component
 * Ensures user is authenticated before rendering
 * children. Handles loading state during session
 * persistence to prevent premature redirects.
 *
 * @param children - Components to render if authorized
 * @param requiredRole - Optional role requirement
 * @returns Protected content or redirect/loading state
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  /**
   * While loading, show spinner instead of redirecting
   * This prevents redirect loops during page refresh
   * when session is being restored
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  /**
   * Only redirect if loading is complete and user
   * is not authenticated
   */

  if (!isAuthenticated || !user) {
    console.error("[ProtectedRoute] Unauthorized access attempt");
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
  /**
   * Check role-based access if required
   */
  const userRoles =
    user.roles?.map((role) => role.name.toLowerCase().replace(/\s+/g, "")) || [];
  const normRequiredRole = requiredRole?.toLowerCase().replace(/\s+/g, "");

  if (
    normRequiredRole &&
    !userRoles.includes(normRequiredRole) &&
    !userRoles.includes("superadmin")
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
