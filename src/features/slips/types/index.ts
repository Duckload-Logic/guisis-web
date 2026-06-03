import { User } from "@/features/users/types/user";

export interface QueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: string;
  statusId?: string | number;
  sortOrder?: "asc" | "desc";
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface SlipCategory {
  id: number;
  name?: string;
}

export interface SlipStatus {
  id: string;
  name: string;
}

export interface SlipStats {
  id: string;
  name: string;
  count: number;
}

export interface Ticket {
  ticketCode: string;
  isVerified: boolean;
  verifiedAt?: string;
}

/**
 * Slip response from API
 */
export interface Slip {
  id?: string;
  iirId?: string;
  user?: User;
  reason: string;
  dateOfAbsence: string;
  dateNeeded: string;
  adminNotes?: string;
  category?: SlipCategory;
  status?: SlipStatus;
  studentCorUrl?: string;
  ticket?: Ticket;
  hasSignificantNote?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request payload for creating a slip
 */
export interface CreateSlipRequest {
  reason: string;
  dateOfAbsence: string;
  dateNeeded: string;
  categoryId: number;
  files?: {
    excuseLetter?: File[];
    parentId?: File[];
    medicalCert?: File[];
  };
}

export interface SlipAttachment {
  id: string;
  slipId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

/**
 * Paginated response for student slips
 */
export interface PaginatedSlipsResponse {
  slips: Slip[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
