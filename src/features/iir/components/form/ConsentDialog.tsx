/**
 * Legal Consent Dialog for IIR Form Submission
 * Displays terms of use and privacy policy acknowledgment
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ConsentDialog({
  open,
  onAccept,
  onCancel,
  isSubmitting = false,
}: ConsentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onCancel()}
    >
      <DialogContent
        hasCloseButton={false}
        className="sm:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Submission</DialogTitle>
          <DialogDescription className="pt-4 text-justify text-base">
            By submitting this form, I hereby certify and testify that all
            information provided herein are true, accurate, and legitimate to
            the best of my knowledge. I acknowledge that any deliberate
            omission, misrepresentation, or falsification of information herein
            shall constitute grounds for disciplinary action, academic
            sanctions, and/or legal penalties in accordance with the rules and
            regulations of the{" "}
            <span className="font-semibold text-primary">
              Polytechnic University of the Philippines - Taguig Campus
            </span>{" "}
            and applicable laws.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <>
                <div
                  className={cn(
                    "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white",
                    "border-t-transparent",
                  )}
                ></div>
                Submitting...
              </>
            ) : (
              "I Agree & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
