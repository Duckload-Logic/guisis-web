/**
 * User Service Layer
 * Handles all user-related API calls
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import { User } from "@/features/users/types/user";

/**
 * Get current authenticated user
 * @param config - Axios config with logging metadata
 * @returns Current user data
 */
export async function GetMe(config?: AxiosConfigWithMeta): Promise<User> {
  try {
    const response = await apiClient.get(API_ROUTES.auth.me, config);
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get user by ID
 * @param userId - User ID
 * @param config - Axios config with logging metadata
 * @returns User data
 */
export async function GetUserById(
  userId: string,
  config?: AxiosConfigWithMeta,
): Promise<User> {
  try {
    const response = await apiClient.get(
      API_ROUTES.users.byId(String(userId)),
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Upload current user's profile picture.
 */
export async function UploadProfilePicture(
  file: File,
  config?: AxiosConfigWithMeta,
): Promise<{ message: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      API_ROUTES.users.profilePictureUpload,
      formData,
      {
        ...config,
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data?.data ?? response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Legacy service object for backward compatibility
 * Gradually migrate to direct function imports
 */
export const userService = {
  GetMe,
  GetUserById,
  UploadProfilePicture,
  // Legacy aliases
  getCurrentUser: GetMe,
  getUserByID: GetUserById,
};
