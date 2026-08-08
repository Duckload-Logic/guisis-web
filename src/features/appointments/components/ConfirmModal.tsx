import { useState } from "react";
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
}

export default function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  requiresMessage,
}: ActionConfirmModalProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (requiresMessage && !message.trim()) {
      setError("A reason or justification is required for this action.");
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="animate-in fade-in zoom-in-95 duration-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm {action}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Are you sure you want to {action.toLowerCase()} this appointment?
            {requiresMessage && " Please provide a reason for this decision."}
          </DialogDescription>
        </DialogHeader>

        {requiresMessage && (
          <div className="py-4">
            <FormField
              placeholder="Enter reason or message..."
              value={message}
              onChange={(val) => {
                setMessage(val);
                if (val.trim()) setError("");
              }}
              isTextarea
              label={"Reason"}
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
