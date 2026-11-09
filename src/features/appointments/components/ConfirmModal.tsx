import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => Promise<boolean>;
  action: string;
  requiresMessage: boolean;
  defaultMessage?: string;
}

export default function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  requiresMessage,
  defaultMessage,
}: ActionConfirmModalProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isNoShow = action.toLowerCase().includes("no-show");

  useEffect(() => {
    if (isOpen) {
      if (defaultMessage) {
        setMessage(defaultMessage);
      } else if (isNoShow) {
        setMessage(
          "Good day. We noticed that you were unable to attend your scheduled " +
            "counseling session today. Could you please share the reason for " +
            "missing your appointment, or let us know if you would like to reschedule?",
        );
      } else {
        setMessage("");
      }
      setError("");
    }
  }, [isOpen, defaultMessage, isNoShow]);

  const handleConfirm = async () => {
    if (requiresMessage && !message.trim()) {
      setError("A reason or message is required for this action.");
      return;
    }

    const success = await onConfirm(requiresMessage ? message : undefined);
    if (success) {
      setMessage("");
      setError("");
    }
  };

  const handleClose = () => {
    setMessage("");
    setError("");
    onClose();
  };

  const titleText = isNoShow
    ? "Mark Appointment as No-Show & Inquire Reason"
    : `Confirm ${action}`;

  const descriptionText = isNoShow
    ? "The appointment will be marked as No-show, and an empathetic inquiry " +
      "message will be sent to the student to check on them and offer options to reschedule."
    : `Are you sure you want to ${action.toLowerCase()} this appointment?${
        requiresMessage ? " Please provide a reason for this decision." : ""
      }`;

  const labelText = isNoShow
    ? "Follow-up Inquiry Message to Student"
    : "Reason / Justification";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="animate-in fade-in zoom-in-95 duration-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>

        {requiresMessage && (
          <div className="py-4">
            <FormField
              placeholder={
                isNoShow
                  ? "Enter follow-up message to inquire reason..."
                  : "Enter reason or message..."
              }
              value={message}
              onChange={(val) => {
                setMessage(val);
                if (val.trim()) setError("");
              }}
              isTextarea
              label={labelText}
              required={requiresMessage}
              error={error}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="transition-all duration-200 hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="transition-all duration-200 hover:scale-105"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
