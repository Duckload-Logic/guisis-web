/**
 * Slip Service Layer
 * Handles all slip-related API calls with consistent error logging
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import type { Slip, PaginatedSlipsResponse, QueryParams } from "../types";

/**
 * Get slip statistics
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Slip statistics
 */
export async function GetSlipStats(
  params?: QueryParams,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(API_ROUTES.slips.stats, {
      ...config,
      params,
    });
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get all slip statuses (lookup data)
 * @param config - Axios config with logging metadata
 * @returns Array of slip statuses
 */
export async function GetSlipStatuses(config?: AxiosConfigWithMeta) {
  try {
    const response = await apiClient.get(
      API_ROUTES.slips.lookups.statuses,
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get all slip categories (lookup data)
 * @param config - Axios config with logging metadata
 * @returns Array of slip categories
 */
export async function GetSlipCategories(config?: AxiosConfigWithMeta) {
  try {
    const response = await apiClient.get(
      API_ROUTES.slips.lookups.categories,
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get current user's slips
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Paginated slip response with iirId
 * @throws Error on 403 (Day One student) or other failures
 */
export async function GetMySlips(
  params?: QueryParams,
  config?: AxiosConfigWithMeta,
): Promise<PaginatedSlipsResponse> {
  try {
    const response = await apiClient.get(API_ROUTES.slips.mySlips, {
      ...config,
      params,
    });
    return response.data;
  } catch (error: any) {
    const handlerName = config?.handlerName || "GetMySlips";

    if (
      error.response?.status === 403 &&
      error.response.data?.error?.includes("IIR")
    ) {
      const stepName = config?.stepName || "Check IIR Profile";
      throw new Error("Please complete your IIR profile");
    }

    const stepName = config?.stepName || "Fetch My Slips";

    throw error;
  }
}

/**
 * Get urgent slips
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Array of urgent slips
 */
export async function GetUrgentSlips(
  params?: QueryParams,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(API_ROUTES.slips.urgent, {
      ...config,
      params,
    });
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get all slips with pagination
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Paginated slip response
 */
export async function GetAllSlips(
  params?: QueryParams,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(API_ROUTES.slips.all, {
      ...config,
      params,
    });
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get slip by ID
 * @param id - Slip ID
 * @param config - Axios config with logging metadata
 * @returns Slip details
 */
export async function GetSlipById(id: string, config?: AxiosConfigWithMeta) {
  try {
    const response = await apiClient.get(API_ROUTES.slips.byId(id), config);
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get slip attachments
 * @param id - Slip ID
 * @param config - Axios config with logging metadata
 * @returns Array of attachments
 */
export async function GetSlipAttachments(
  id: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(
      API_ROUTES.slips.attachments(id),
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Submit a new slip
 * @param data - Slip creation request as multipart form data
 * @param config - Axios config with logging metadata
 * @returns Created slip response
 * @throws Error on 403 (Day One student) or other failures
 */
export async function PostSlip(
  data: FormData,
  config?: AxiosConfigWithMeta,
): Promise<Slip> {
  try {
    const response = await apiClient.post(API_ROUTES.slips.all, data, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": undefined,
      },
    });
    return response.data;
  } catch (error: any) {
    const handlerName = config?.handlerName || "PostSlip";

    if (error.response?.status === 403) {
      const stepName = config?.stepName || "Check IIR Profile";

      throw new Error("Please complete your IIR profile");
    }

    const stepName = config?.stepName || "Submit Slip";

    throw error;
  }
}

/**
 * Update an existing slip (multipart/form-data)
 * @param id - Slip ID
 * @param data - Updated data
 * @param config - Axios config
 * @returns Updated slip
 */
export async function PatchSlip(
  id: string,
  data: FormData,
  config?: AxiosConfigWithMeta,
): Promise<Slip> {
  try {
    const response = await apiClient.patch(API_ROUTES.slips.update(id), data, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": undefined,
      },
    });
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Update slip status
 * @param id - Slip ID
 * @param status - New status
 * @param adminNotes - Optional admin notes
 * @param config - Axios config with logging metadata
 * @returns Updated slip response
 */
export async function PatchSlipStatus(
  id: string,
  status: string,
  adminNotes?: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const payload: { status: string; adminNotes?: string } = {
      status,
    };

    if (adminNotes !== undefined) {
      payload.adminNotes = adminNotes;
    }

    const response = await apiClient.patch(
      API_ROUTES.slips.updateStatus(id),
      payload,
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Claim/Verify a ticket on-site
 * @param ticketCode - The ticket code to verify
 * @param config - Axios config with logging metadata
 * @returns Success message
 */
export async function ClaimTicket(
  ticketCode: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.post(
      API_ROUTES.slips.claimTicket,
      { ticketCode },
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get slip details by ticket code (Admin only)
 * @param code - Ticket code
 * @param config - Axios config
 * @returns Slip details
 */
export async function GetTicketDetails(
  code: string,
  config?: AxiosConfigWithMeta,
): Promise<Slip> {
  try {
    const response = await apiClient.get(
      API_ROUTES.slips.ticketByCode(code),
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Download slip attachment
 * @param slipId - Slip ID
 * @param attachmentId - Attachment ID
 * @param config - Axios config with logging metadata
 * @returns Blob data for file download
 */
export async function GetSlipAttachmentDownload(
  slipId: string,
  attachmentId: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(
      API_ROUTES.slips.downloadAttachment(slipId, attachmentId),
      {
        ...config,
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

export const slipService = {
  GetSlipStats,
  GetSlipStatuses,
  GetSlipCategories,
  GetMySlips,
  GetUrgentSlips,
  GetAllSlips,
  GetSlipById,
  GetSlipAttachments,
  PostSlip,
  PatchSlip,
  PatchSlipStatus,
  ClaimTicket,
  GetTicketDetails,
  GetSlipAttachmentDownload,
};
