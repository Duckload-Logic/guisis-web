/**
 * Modal for adding a new significant note
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import {
  significantNoteSchema,
  SignificantNoteFormData,
} from "../validation/noteSchema";
import { FormInput } from "@/components/form";

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SignificantNoteFormData) => Promise<void>;
  isSubmitting?: boolean;
  appointmentId?: string;
  admissionSlipId?: string;
}

export default function AddNoteModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  appointmentId,
  admissionSlipId,
}: AddNoteModalProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SignificantNoteFormData>({
    resolver: zodResolver(significantNoteSchema),
    defaultValues: {
      appointmentId: appointmentId || "",
      admissionSlipId: admissionSlipId || "",
      note: "",
      remarks: "",
    },
  });

  // Update appointmentId or admissionSlipId if prop changes
  useEffect(() => {
    if (open && (appointmentId || admissionSlipId)) {
      reset({
        appointmentId: appointmentId || "",
        admissionSlipId: admissionSlipId || "",
        note: "",
        remarks: "",
      });
    }
  }, [open, appointmentId, admissionSlipId, reset]);

  const handleFormSubmit = async (data: SignificantNoteFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleClose}
    >
      <ResponsiveModalContent className="sm:max-w-[600px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Add Significant Note</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Record a significant incident or note about the student. All fields
            are required.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Note / Incident Description"
                placeholder="Describe the incident or observation..."
                isTextarea
                required
                {...field}
                error={errors.note?.message}
              />
            )}
          />

          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Action Taken / Remarks"
                placeholder="Describe the action taken or additional remarks..."
                isTextarea
                required
                {...field}
                error={errors.remarks?.message}
              />
            )}
          />

          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
