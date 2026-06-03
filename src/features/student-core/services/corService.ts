import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { validateCorFile } from "@/utils/corValidation";

/**
 * Upload a new COR
 */
export async function UploadCOR(
  file: File,
  config?: AxiosConfigWithMeta,
): Promise<{ message: string; fileId: string }> {
  const validation = await validateCorFile(file);

  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid COR file.");
  }

  const formData = new FormData();
  formData.append("cor", file);

  try {
    const response = await apiClient.post(
      "/students/inventory/cors",
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
 * Get all CORs for the current student
 */
export async function GetMyCORs(config?: AxiosConfigWithMeta): Promise<any[]> {
  try {
    const response = await apiClient.get("/students/inventory/cors", config);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    throw error;
  }
}
