/**
 * TypeScript interfaces for Significant Notes feature
 * Matches backend SignificantNoteDTO structure
 */

export interface SignificantNote {
  id?: string;
  appointmentId?: string;
  admissionSlipId?: string;
  note: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteRequest {
  appointmentId?: string;
  admissionSlipId?: string;
  note: string;
  remarks: string;
}
