/**
 * Authentication Context
 * Provides global authentication state and bootstrapper
 * integration with proper session persistence and
 * timeout safeguards to prevent infinite loading
 */

import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "@/features/users/hooks/useMe";
import { useLogout as useLogoutMutation } from "@/features/auth/hooks";
import { User, UserRole } from "@/features/users/types/user";
import { resetSessionUIPreferences } from "@/utils/uiPreferences";
import { DeletePushSubscribe } from "@/features/notifications/services";
import { isAuthPath } from "@/utils";

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

const AUTH_TIMEOUT_MS = 5000;
const SESSION_EXPIRED_EVENT = "ogos:session-expired";

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);
  const isCallbackPage = window.location.pathname === "/auth/callback";
  const isAuthPage = isAuthPath(window.location.pathname);
  const hasSessionFlag = localStorage.getItem("session_active") === "true";

  const {
    data: user,
    status,
    isError,
    refetch,
  } = useMe({ enabled: !isCallbackPage && (hasSessionFlag || !isAuthPage) });
  const { logout: logoutMutation } = useLogoutMutation();
  const [hasTimedOut, setHasTimedOut] = useState(false);

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

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem("session_active");
      localStorage.removeItem("active_role");
      setActiveRoleState(null);
      setSessionExpired(true);

      const pathname = window.location.pathname;
      const isAlreadyOnAuthPage = isAuthPath(pathname);

      if (!isAlreadyOnAuthPage) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [navigate]);

  useEffect(() => {
    if (status === "success" && user && hasSessionFlag) {
      setSessionExpired(false);
    }
  }, [status, user, hasSessionFlag]);

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
          setActiveRoleState(null);
          localStorage.removeItem("active_role");
        }
      }
    }
  }, [user, activeRole]);

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("session_active");
      localStorage.removeItem("active_role");
      setActiveRoleState(null);
      setSessionExpired(true);
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
          const readyPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1000),
          );
          const reg = (await Promise.race([
            readyPromise,
            timeoutPromise,
          ])) as ServiceWorkerRegistration;

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

  const isAuthenticated = !sessionExpired && status === "success" && !!user;

  const currentRoleName =
    activeRole?.name?.toLowerCase().replace(/\s+/g, "") || "";
  const isStudent = currentRoleName === "student";
  const isAdmin =
    currentRoleName === "admin" || currentRoleName === "counselor";
  const isSuperAdmin = currentRoleName === "superadmin";
  const isDeveloper = currentRoleName === "developer";

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