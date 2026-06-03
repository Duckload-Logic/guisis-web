/**
 * Authentication Hook
 * Handles login and logout with bootstrapper integration
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PostLogin, LoginPayload, GetLogoutURL } from "../services/index";
import { QUERY_KEYS } from "@/config/queryKeys";
import { resetSessionUIPreferences } from "@/utils/uiPreferences";

/**
 * Login mutation hook
 * Triggers bootstrap on successful login
 *
 * @returns Login mutation and state
 */
export function useLogin() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => PostLogin(payload),
    onSuccess: async () => {
      try {
        // Set session flag to enable auth queries
        localStorage.setItem("session_active", "true");

        // Invalidate user query to refetch
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users.me,
        });
      } catch (error: any) {
        throw error;
      }
    },
  });

  return {
    login: mutation.mutateAsync,
    isLoggingIn: mutation.isPending,
    loginError: mutation.error,
  };
}

/**
 * Logout hook
 * Synchronizes with backend front-channel redirect by initiating
 * direct browser navigation to the logout endpoint.
 *
 * @returns Logout function and state
 */
export function useLogout() {
  const logout = () => {
    // Clear local session state and reset session-scoped UI preferences.
    resetSessionUIPreferences();
    localStorage.removeItem("session_active");
    window.location.href = GetLogoutURL();
  };

  return {
    logout,
    isLoggingOut: false,
  };
}
