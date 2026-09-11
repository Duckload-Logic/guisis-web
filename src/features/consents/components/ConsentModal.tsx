import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConsentModalProps = {
  open: boolean;
  role: string;
  loading?: boolean;
  onAccept: () => Promise<void> | void;
  onCancel?: () => void;
};

export default function ConsentModal({
  open,
  role: _role,
  loading = false,
  onAccept,
  onCancel,
}: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {}}
    >
      <DialogContent
        className={cn(
          "max-w-[500px] border-border bg-card p-5 sm:p-6",
          "shadow-2xl outline-none",
        )}
        hasCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "bg-primary/10 text-primary",
            )}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle asChild>
              <h2
                id="terms-title"
                className="text-base font-bold text-foreground sm:text-lg"
              >
                Terms and Conditions
              </h2>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Data Privacy Act &amp; Service Consent
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div
          className={cn(
            "space-y-2.5 text-xs sm:text-sm leading-relaxed",
            "text-muted-foreground",
          )}
        >
          <p>
            By acknowledging below, you consent to the collection, use, and
            processing of your personal information solely for guidance,
            counseling, and legitimate university purposes.
          </p>
          <p>
            Handled strictly in accordance with PUP&apos;s{" "}
            <a
              className={cn(
                "font-semibold text-primary underline underline-offset-2",
                "hover:text-primary/80 transition-colors",
              )}
              target="_blank"
              rel="noreferrer"
              href="https://www.pup.edu.ph/privacy"
            >
              Privacy Policy
            </a>{" "}
            and compliance with the{" "}
            <span className="font-semibold text-foreground">
              Data Privacy Act of 2012 (RA 10173)
            </span>
            .
          </p>
        </div>

        {/* Checkbox acknowledgement */}
        <div
          className={cn(
            "rounded-xl border border-border bg-muted/40 p-3 sm:p-3.5",
          )}
        >
          <label
            htmlFor="terms-agree"
            className="flex cursor-pointer items-center gap-3 select-none"
          >
            <input
              id="terms-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center",
                "rounded-md border border-muted-foreground/40 bg-background",
                "transition-all duration-200",
                "peer-checked:border-primary peer-checked:bg-primary",
              )}
            >
              {agreed && (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3.5 w-3.5 text-primary-foreground"
                  aria-hidden="true"
                >
                  <path
                    d="M5 10.5l3.2 3.2L15 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              I agree to the{" "}
              <a
                className={cn(
                  "font-semibold text-primary underline underline-offset-2",
                  "hover:text-primary/80 transition-colors",
                )}
                target="_blank"
                rel="noreferrer"
                href="https://www.pup.edu.ph/terms"
              >
                Terms of Service
              </a>
              .
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center justify-end gap-2.5 pt-1">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className={cn(
                "h-10 rounded-xl px-4 text-xs sm:text-sm font-semibold",
              )}
            >
              Sign out
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!agreed || loading}
            onClick={onAccept}
            className={cn(
              "h-10 rounded-xl px-5 text-xs sm:text-sm font-semibold",
              "transition-all",
              !agreed || loading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
