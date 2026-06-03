/**
 * AuthCallback Component
 * Handles OAuth 2.0 callback after IDP authentication
 * Extracts authorization code and state from URL, exchanges
 * them for tokens, and redirects user to role-based dashboard
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PostIDPTokenExchange, GetCurrentUser } from "@/features/auth/services";
import {
  IDP_ERROR_MESSAGES,
  ROLE_ROUTES_INTERNAL,
  ERROR_DISMISS_TIMEOUT,
} from "@/features/auth/types/idp";
import { useAuth } from "@/context";
import { useRef } from "react";
import { useLogout } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

/**
 * OAuth callback page component
 * Lifecycle:
 * 1. Mount: Extract code and state from URL params
 * 2. Validate: Check both params exist
 * 3. Exchange: Call backend to exchange code for tokens
 * 4. Fetch: Get current user profile to determine role
 * 5. Route: Redirect to role-based dashboard with replace
 *
 * @returns JSX element showing loading or error state
 */
export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authStarted = useRef(false);
  const { logout } = useLogout();

  useEffect(() => {
    if (authStarted.current) return;
    authStarted.current = true;

    /**
     * Processes OAuth callback and routes user
     * Runs once on component mount
     */
    const processCallback = async () => {
      try {
        // Extract parameters from URL
        const type = searchParams.get("type");
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");
        const isNative = type === "native";

        // Handle IDP error response
        if (errorParam) {
          const errorDesc = searchParams.get("error_description");
          setError(errorDesc || IDP_ERROR_MESSAGES.MISSING_CODE);
          setIsLoading(false);
          return;
        }

        // Use Same normalization as rest of app
        let roleKey = "student";

        // Use returned data if available (OAuth)
        let user: any;

        if (!isNative) {
          if (!code) {
            setError(IDP_ERROR_MESSAGES.MISSING_CODE);
            setIsLoading(false);
            return;
          }

          // Exchange code for tokens (OAuth only)
          await PostIDPTokenExchange({ code });

          // Set session flag to enable auth queries
          localStorage.setItem("session_active", "true");

          // Synchronize AuthContext state before proceeding
          await refresh();

          user = await GetCurrentUser();

          roleKey =
            user.roles?.[0]?.name?.toLowerCase().replace(/\s+/g, "") ||
            "student";
        } else {
          // Synchronize AuthContext state (Native already refetched in Login.tsx
          // but we call it anyway for robustness)
          localStorage.setItem("session_active", "true");
          await refresh();

          user = await GetCurrentUser();
          if (!user.roles || user.roles.length === 0) {
            throw new Error("User has no roles assigned");
          }
          roleKey =
            user.roles?.[0]?.name?.toLowerCase().replace(/\s+/g, "") ||
            "student";
        }

        // If multi-role, go to selection gateway
        if (user && user.roles.length > 1) {
          navigate("/auth/role-selection", { replace: true });
          return;
        }

        const dashboardRoute = (ROLE_ROUTES_INTERNAL as Record<string, string>)[
          roleKey
        ];

        if (!dashboardRoute) {
          setError(IDP_ERROR_MESSAGES.UNKNOWN_ROLE);
          await logout();
          setIsLoading(false);
          return;
        }

        // Navigate to dashboard with replace
        navigate(dashboardRoute, { replace: true });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : IDP_ERROR_MESSAGES.TOKEN_EXCHANGE_FAILED;

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  /**
   * Auto-dismiss error after timeout
   */
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        navigate("/login", { replace: true });
      }, ERROR_DISMISS_TIMEOUT);

      return () => clearTimeout(timeoutId);
    }
  }, [error, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative flex min-h-screen items-center justify-center",
          "overflow-hidden bg-[hsl(var(--background))]",
        )}
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <div
            className={cn(
              "absolute -left-[10%] -top-[10%] h-[40%] w-[40%]",
              "animate-pulse rounded-full bg-primary/10 blur-[120px]",
            )}
          />
          <div
            className={cn(
              "absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%]",
              "animate-pulse rounded-full bg-secondary/10 blur-[120px]",
              "[animation-delay:2s]",
            )}
          />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2",
              "-translate-y-1/2 rounded-full bg-primary/5 blur-[100px]",
            )}
          />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div
            className={cn(
              "group relative overflow-hidden rounded-[32px] border",
              "border-white/20 bg-white/10 p-12",
              "shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] backdrop-blur-xl",
              "dark:border-white/10 dark:bg-black/20",
            )}
          >
            {/* Inner Glow */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br",
                "from-white/5 to-transparent",
              )}
            />

            <div className="flex flex-col items-center">
              {/* Custom High-Fidelity Loader */}
              <div className="relative mb-10 h-24 w-24">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-t-primary" />

                {/* Middle Ring (Reverse rotation) */}
                <div className="absolute inset-3 rounded-full border-[2px] border-secondary/20" />
                <div
                  className={cn(
                    "absolute inset-3 animate-[spin_1.5s_linear_infinite_reverse]",
                    "rounded-full border-[2px] border-b-secondary",
                  )}
                />

                {/* Inner Pulsing Core */}
                <div
                  className={cn(
                    "absolute inset-7 flex items-center justify-center",
                    "rounded-full bg-primary",
                    "shadow-[0_0_20px_rgba(var(--primary),0.4)]",
                  )}
                >
                  <div className="h-full w-full animate-ping rounded-full bg-white/20" />
                </div>
              </div>

              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-foreground/90">
                  Verifying Session
                </h2>
                <div className="flex items-center justify-center space-x-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                </div>
                <p className="max-w-[240px] text-sm leading-relaxed text-muted-foreground/80">
                  Securely authenticating your credentials. Please wait a
                  moment.
                </p>
              </div>
            </div>
          </div>

          {/* Subtle decoration */}
          <p
            className={cn(
              "mt-8 text-center text-[11px] font-medium uppercase",
              "tracking-[0.2em] text-muted-foreground/40",
            )}
          >
            GuiSIS • Secure Gateway
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "relative flex min-h-screen items-center justify-center",
          "bg-[hsl(var(--background))] p-6",
        )}
      >
        <div
          className={cn(
            "w-full max-w-md overflow-hidden rounded-[32px] border",
            "border-destructive/20 bg-destructive/5 p-10 shadow-2xl",
            "backdrop-blur-xl",
          )}
        >
          <div
            className={cn(
              "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl",
              "bg-destructive/10 text-destructive",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-alert-circle"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <line
                x1="12"
                x2="12"
                y1="8"
                y2="12"
              />
              <line
                x1="12"
                x2="12.01"
                y1="16"
                y2="16"
              />
            </svg>
          </div>

          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
            Authentication Failed
          </h2>

          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            {error ||
              "An unexpected error occurred during authentication. Please try logging in again."}
          </p>

          <button
            onClick={() => navigate("/login", { replace: true })}
            className={cn(
              "group relative flex w-full items-center justify-center",
              "overflow-hidden rounded-xl bg-primary px-6 py-4 font-semibold",
              "text-primary-foreground transition-all hover:bg-primary/90",
              "active:scale-[0.98]",
            )}
          >
            <span className="relative z-10">Return to Login</span>
            <div
              className={cn(
                "absolute inset-0 -translate-x-full bg-gradient-to-r",
                "from-transparent via-white/10 to-transparent",
                "group-hover:animate-[shimmer_1.5s_infinite]",
              )}
            />
          </button>

          <div
            className={cn(
              "mt-6 flex items-center justify-center space-x-2 text-[10px]",
              "font-bold uppercase text-muted-foreground/40",
            )}
          >
            <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
            <span>Auto-redirecting in {ERROR_DISMISS_TIMEOUT / 1000}s</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
