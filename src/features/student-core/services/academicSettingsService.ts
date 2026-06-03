import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

/**
 * Get the current global academic year + term setting
 */
export const GetAcademicSettings = async (
  config?: AxiosConfigWithMeta,
): Promise<{
  currentYearStart: number;
  currentYearEnd: number;
  currentTerm: number;
  updatedAt: string;
}> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.academic.settings,
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update the global academic year + term setting
 */
export const PutAcademicSettings = async (
  data: {
    currentYearStart: number;
    currentYearEnd: number;
    currentTerm: number;
  },
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.put(
      API_ROUTES.academic.settings,
      data,
      config,
    );
  } catch (error) {
    throw error;
  }
};
