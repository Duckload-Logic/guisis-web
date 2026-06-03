import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/service";
import { QUERY_KEYS } from "@/config/queryKeys";
import { User } from "../types/user";

/**
 * Fetch current authenticated user
 * Configured to prevent multiple retries and maintain
 * session across page refreshes
 *
 * @param enabled - Whether to enable the query
 * @returns Query result with user data
 */
export function useMe({ enabled = true }: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.users.me,
    queryFn: async (): Promise<User> => {
      return await userService.GetMe({
        handlerName: "useMe",
        stepName: "Fetch Current User",
      });
    },
    enabled,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
