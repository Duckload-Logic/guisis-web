import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PRIVACY_DISCLOSURES } from "@/config/constants";
import { cn } from "@/lib/utils";

const PUP_PRIVACY_URL = "https://www.pup.edu.ph/privacy";
const PUP_TERMS_URL = "https://www.pup.edu.ph/terms";

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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (open) {
      setAgreed(false);
      setShowDetails(false);
    }
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
                Your Privacy Matters
              </h2>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              How we protect your information at PUP-Taguig
            </p>
          </div>
        </div>

        {/* Concise Primary Summary */}
        <div
          className={cn(
            "space-y-2 text-xs leading-relaxed text-muted-foreground",
            "sm:text-sm",
          )}
        >
          <p>{PRIVACY_DISCLOSURES.PRIMARY_SUMMARY}</p>
          <p>{PRIVACY_DISCLOSURES.COOKIE_SUMMARY}</p>

          {/* Progressive Disclosure Toggle */}
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 text-xs",
              "font-semibold text-primary transition-colors",
              "hover:text-primary/80",
            )}
          >
            <span>
              {showDetails ? "Hide details" : "How is my information used?"}
            </span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <ul
              className={cn(
                "space-y-2 rounded-xl border border-border/70",
                "bg-muted/30 p-3 text-xs",
              )}
            >
              {PRIVACY_DISCLOSURES.BULLETS.map((item) => (
                <li key={item.title}>
                  <strong className="text-foreground">{item.title}</strong>{" "}
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checkbox acknowledgement */}
        <div
          className={cn(
            "rounded-xl border border-border bg-muted/40 p-3 sm:p-3.5",
          )}
        >
          <label
            htmlFor="terms-agree"
            className={cn(
              "flex min-h-11 cursor-pointer select-none items-center gap-3",
            )}
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
            <span className="text-xs font-medium text-foreground sm:text-sm">
              I understand and agree to the{" "}
              <a
                className={cn(
                  "font-semibold text-primary underline underline-offset-2",
                  "transition-colors hover:text-primary/80",
                )}
                target="_blank"
                rel="noreferrer"
                href={PUP_PRIVACY_URL}
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                className={cn(
                  "font-semibold text-primary underline underline-offset-2",
                  "transition-colors hover:text-primary/80",
                )}
                target="_blank"
                rel="noreferrer"
                href={PUP_TERMS_URL}
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
                "h-11 rounded-xl px-4 text-xs font-semibold sm:text-sm",
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
              "h-11 rounded-xl px-5 text-xs font-semibold sm:text-sm",
              "transition-all",
              !agreed || loading
                ? "cursor-not-allowed bg-muted text-muted-foreground"
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
