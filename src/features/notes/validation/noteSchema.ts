import { z } from "zod";

/**
 * Validation schema for creating a significant note
 * Matches backend validation requirements
 */
export const significantNoteSchema = z.object({
  appointmentId: z.string().optional(),
  admissionSlipId: z.string().optional(),
  note: z
    .string()
    .min(1, "Note description is required")
    .max(5000, "Note description must be less than 5000 characters"),
  remarks: z
    .string()
    .min(1, "Action taken/remarks is required")
    .max(5000, "Remarks must be less than 5000 characters"),
});

export type SignificantNoteFormData = z.infer<typeof significantNoteSchema>;
