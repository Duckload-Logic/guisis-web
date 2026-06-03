import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PostSlip, PatchSlip, PatchSlipStatus, ClaimTicket } from "../services";
import type { CreateSlipRequest } from "../types";
import { QUERY_KEYS } from "@/config/queryKeys";
import { validateCorFile } from "@/utils/corValidation";

const validateCorFiles = async (files: File[] = []) => {
  for (const file of files) {
    const validation = await validateCorFile(file, {
      maxSizeBytes: 5 * 1024 * 1024,
    });

    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid COR file.");
    }
  }
};

/**
 * Hook to submit a new admission slip
 */
export function useSubmitSlip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSlipRequest) => {
      const formData = new FormData();

      formData.append("reason", data.reason);
      formData.append("dateOfAbsence", data.dateOfAbsence);
      formData.append("dateNeeded", data.dateNeeded);
      formData.append("categoryId", String(data.categoryId));

      data.files?.excuseLetter?.forEach((file) => {
        formData.append("excuseLetter", file);
      });

      data.files?.parentId?.forEach((file) => {
        formData.append("parentId", file);
      });

      data.files?.medicalCert?.forEach((file) => {
        formData.append("medicalCert", file);
      });

      return PostSlip(formData, {
        handlerName: "useSubmitSlip",
        stepName: "Submit Slip",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.mySlips,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}

/**
 * Hook to update an existing admission slip (Student)
 */
export function useUpdateSlip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CreateSlipRequest;
    }) => {
      const formData = new FormData();

      formData.append("reason", data.reason);
      formData.append("dateOfAbsence", data.dateOfAbsence);
      formData.append("dateNeeded", data.dateNeeded);
      formData.append("categoryId", String(data.categoryId));

      data.files?.excuseLetter?.forEach((file) => {
        formData.append("excuseLetter", file);
      });
      data.files?.parentId?.forEach((file) => {
        formData.append("parentId", file);
      });
      data.files?.medicalCert?.forEach((file) => {
        formData.append("medicalCert", file);
      });

      return PatchSlip(id, formData, {
        handlerName: "useUpdateSlip",
        stepName: "Update Slip",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.mySlips,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.slips.all, "byId"],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}

/**
 * Hook to update an existing slip's status (Admin only)
 */
export function useUpdateSlipStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: string;
      adminNotes?: string;
    }) => {
      return PatchSlipStatus(id, status, adminNotes, {
        handlerName: "useUpdateSlipStatus",
        stepName: "Update Status",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.mySlips,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}

/**
 * Hook to claim/verify a ticket on-site (Admin only)
 */
export function useClaimTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketCode: string) => {
      return ClaimTicket(ticketCode, {
        handlerName: "useClaimTicket",
        stepName: "Verify Ticket",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}
