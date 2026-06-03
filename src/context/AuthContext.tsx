/**
 * Authentication Context
 * Provides global authentication state and bootstrapper
 * integration with proper session persistence and
 * timeout safeguards to prevent infinite loading
 */

import React, { createContext, useEffect, useState } from "react";
import { useMe } from "@/features/users/hooks/useMe";
import { useLogout as useLogoutMutation } from "@/features/auth/hooks";
import { User, UserRole } from "@/features/users/types/user";
import { resetSessionUIPreferences } from "@/utils/uiPreferences";
import { DeletePushSubscribe } from "@/features/notifications/services";

interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
  user: User | null;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  refresh: () => Promise<void>;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDeveloper: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * Timeout duration (ms) to prevent infinite loading
 * If useMe doesn't resolve within this time, force
 * loading state to false to allow redirect to login
 */
const AUTH_TIMEOUT_MS = 5000;

/**
 * Authentication Provider
 * Wraps app with auth context and triggers bootstrap
 * on successful authentication. Maintains session
 * across page refreshes by deferring redirect until
 * useMe query completes. Includes timeout safeguard
 * to prevent infinite loading on auth failures.
 *
 * @param children - React components to wrap
 */
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const isCallbackPage = window.location.pathname === "/auth/callback";
  const isAuthPage =
    window.location.pathname === "/" ||
    window.location.pathname === "/login" ||
    window.location.pathname === "/register" ||
    window.location.pathname.startsWith("/auth");
  const hasSessionFlag = localStorage.getItem("session_active") === "true";

  const {
    data: user,
    status,
    isError,
    refetch,
  } = useMe({ enabled: !isCallbackPage && (hasSessionFlag || !isAuthPage) });
  const { logout: logoutMutation } = useLogoutMutation();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Active Role state with persistence
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem("active_role");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem("active_role", JSON.stringify(role));
  };

  /**
   * Timeout safeguard: If auth check takes too long,
   * force loading to false to prevent app lockout
   */
  useEffect(() => {
    if (status === "pending") {
      const timeoutId = setTimeout(() => {
        console.warn(
          "[AuthProvider] {Timeout}: Auth check " +
            "exceeded 5s, forcing loading state to false",
        );
        setHasTimedOut(true);
      }, AUTH_TIMEOUT_MS);

      return () => clearTimeout(timeoutId);
    } else {
      setHasTimedOut(false);
    }
  }, [status]);

  /**
   * Sync activeRole with user roles
   */
  useEffect(() => {
    if (user && user.roles) {
      const isRoleValid =
        activeRole && user.roles.some((r) => r.id === activeRole.id);

      if (!isRoleValid) {
        if (user.roles.length === 1) {
          setActiveRole(user.roles[0]);
        } else if (
          !window.location.pathname.startsWith("/auth/role-selection")
        ) {
          // If multi-role and not on selection page, reset
          setActiveRoleState(null);
          localStorage.removeItem("active_role");
        }
      }
    }
  }, [user, activeRole]);

  /**
   * Clear session flag on error
   */
  useEffect(() => {
    if (isError) {
      localStorage.removeItem("session_active");
      localStorage.removeItem("active_role");
      setActiveRoleState(null);
    }
  }, [isError]);

  const logout = () => {
    const performLogout = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window
        ) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await DeletePushSubscribe(sub.endpoint);
          }
        }
      } catch (e) {
        console.error("Failed to delete push subscription on logout:", e);
      } finally {
        resetSessionUIPreferences();
        logoutMutation();
      }
    };
    performLogout();
  };

  /**
   * Authentication is true only if query succeeded
   * and we have a user object
   */
  const isAuthenticated = status === "success" && !!user;

  /**
   * Role identification based on backend-provided roles collection
   */
  const userRoles =
    user?.roles?.map((r) => r.name.toLowerCase().replace(/\s+/g, "")) || [];
  const isStudent = userRoles.includes("student");
  const isAdmin = userRoles.includes("admin");
  const isSuperAdmin = userRoles.includes("superadmin");
  const isDeveloper = userRoles.includes("developer");

  /**
   * Loading is true only while query is pending
   * AND no error has occurred AND timeout hasn't fired
   * This ensures loading state resolves in all cases:
   * - Success: status becomes "success"
   * - Error: status becomes "error"
   * - Timeout: hasTimedOut becomes true
   */
  const isAuthLoading = status === "pending" && !isError && !hasTimedOut;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: user || null,
        activeRole,
        setActiveRole,
        logout,
        isLoading: isAuthLoading,
        refresh: async () => {
          await refetch();
        },
        isStudent,
        isAdmin,
        isSuperAdmin,
        isDeveloper,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
