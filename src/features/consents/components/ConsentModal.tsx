import { useEffect, useState } from "react";
import {
  HeartHandshake,
  LockKeyhole,
  MapPin,
  ShieldAlert,
} from "lucide-react";
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
  role,
  loading = false,
  onAccept,
  onCancel,
}: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  if (!open) return null;

  const normalizedRole = role.toLowerCase().replace(/\s+/g, "");
  const isStudent = normalizedRole === "student";
  const accentClass = role === "admin" ? "bg-[#8f1113]" : "bg-[#c62828]";

  if (isStudent) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className={cn(
            "flex max-h-[92dvh] w-[calc(100%_-_2rem)] flex-col overflow-hidden",
            "rounded-xl border border-border bg-card p-0 shadow-md outline-none",
            "sm:max-w-[680px]",
          )}
          hasCloseButton={false}
        >
          <header className="shrink-0 border-b border-border bg-card px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-primary text-primary-foreground",
                )}
                aria-hidden="true"
              >
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="min-w-0 pt-0.5">
                <DialogTitle asChild>
                  <h2
                    id="terms-title"
                    className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]"
                  >
                    Important System Notice
                  </h2>
                </DialogTitle>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Please review these safeguards before continuing to GuiSIS.
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <section
              className="space-y-3"
              aria-labelledby="student-safeguard-heading"
            >
              <h3 id="student-safeguard-heading" className="sr-only">
                Student safeguard reminders
              </h3>

              <div
                className={cn(
                  "rounded-xl border border-primary/25 border-l-4 border-l-primary",
                  "bg-primary/5 px-4 py-3.5 sm:px-5 sm:py-4",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10"
                    aria-hidden="true"
                  >
                    <ShieldAlert className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold leading-6 text-foreground">
                      Do not request an appointment or an admission slip from
                      the system at this stage.
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Please wait for further Guidance Office instructions before
                      using these request features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/25 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background"
                      aria-hidden="true"
                    >
                      <LockKeyhole className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Data Privacy Notice
                      </p>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                        To safeguard the confidentiality and safety of the
                        student, please refrain from submitting sensitive
                        personal or private information into this system.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/25 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background"
                      aria-hidden="true"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        For Inquiries
                      </p>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                        For inquiries, please proceed to the Guidance Office.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border/70 px-4 py-3">
                <HeartHandshake
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                  The Guidance Office is dedicated to promoting and enforcing
                  student wellness and safety.
                </p>
              </div>
            </section>

            <div className="my-5 border-t border-border" />

            <section aria-labelledby="privacy-consent-heading">
              <h3 id="privacy-consent-heading" className="sr-only">
                Privacy policy and consent
              </h3>

              <div className="space-y-5 text-[16px] leading-9 text-foreground">
                <p>
                  By clicking{" "}
                  <span className="font-bold text-primary">“I Agree”</span>, you
                  consent to the collection, use, and processing of your personal
                  data for legitimate purposes related to this service.
                </p>

                <p>
                  Your information will be handled in accordance with our{" "}
                  <a
                    className={cn(
                      "cursor-pointer font-bold text-secondary underline transition-colors",
                      "duration-200 hover:text-secondary/70",
                    )}
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.pup.edu.ph/privacy"
                  >
                    Privacy Policy
                  </a>{" "}
                  and in compliance with the{" "}
                  <span className="font-bold text-primary">
                    Data Privacy Act of 2012
                  </span>
                  .
                </p>
              </div>

              <div
                className={cn(
                  "mt-5 via-primary-100 from-primary-50 to-glass-bg",
                  "rounded-xl border border-border",
                  "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
                  "px-5 py-5",
                )}
              >
                <label
                  htmlFor="terms-agree"
                  className="flex cursor-pointer items-start gap-4"
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
                      "mt-1 flex h-6 w-6 shrink-0 items-center justify-center",
                      "rounded-md border border-slate-400 bg-glass-bg transition",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
                      "peer-checked:border-[#8f1113] peer-checked:bg-[#8f1113]",
                    )}
                  >
                    {agreed ? (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 text-white"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 10.5l3.2 3.2L15 7"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>

                  <span className="text-base leading-7 text-foreground">
                    I agree and acknowledge the{" "}
                    <a
                      className={cn(
                        "cursor-pointer font-bold text-primary transition-colors",
                        "duration-200 hover:text-primary/60",
                      )}
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.pup.edu.ph/terms"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Terms of Service
                    </a>
                    .
                  </span>
                </label>
              </div>
            </section>
          </div>

          <footer className="shrink-0 border-t border-border bg-card px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              {onCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="h-11 min-w-[120px] rounded-xl px-5 text-sm font-semibold"
                >
                  Sign out
                </Button>
              ) : null}

              <Button
                type="button"
                disabled={!agreed || loading}
                onClick={onAccept}
                className={cn(
                  "h-11 min-w-[150px] rounded-xl px-5 text-sm font-semibold",
                  "transition-colors",
                  agreed && !loading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-0 bg-muted text-muted-foreground",
                )}
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          "rounded-xl border-glass-border bg-card p-6 outline-none",
          "sm:w-full sm:max-w-2xl sm:p-8",
        )}
        hasCloseButton={false}
      >
        <div className={`mb-6 rounded-xl px-6 py-4 text-white ${accentClass}`}>
          <DialogTitle asChild>
            <h2 id="terms-title" className="text-2xl font-bold">
              Terms and Conditions
            </h2>
          </DialogTitle>
        </div>

        <div className="space-y-5 text-[16px] leading-9 text-foreground">
          <p>
            By clicking{" "}
            <span className="font-bold text-primary">“I Agree”</span>, you
            consent to the collection, use, and processing of your personal data
            for legitimate purposes related to this service.
          </p>

          <p>
            Your information will be handled in accordance with our{" "}
            <a
              className={cn(
                "cursor-pointer font-bold text-secondary underline transition-colors",
                "duration-200 hover:text-secondary/70",
              )}
              target="_blank"
              rel="noreferrer"
              href="https://www.pup.edu.ph/privacy"
            >
              Privacy Policy
            </a>{" "}
            and in compliance with the{" "}
            <span className="font-bold text-primary">
              Data Privacy Act of 2012
            </span>
            .
          </p>
        </div>

        <div
          className={cn(
            "via-primary-100 from-primary-50 to-glass-bg",
            "rounded-xl border border-border",
            "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
            "px-5 py-5",
          )}
        >
          <label
            htmlFor="terms-agree"
            className="flex cursor-pointer items-start gap-4"
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
                "mt-1 flex h-6 w-6 shrink-0 items-center justify-center",
                "rounded-md border border-slate-400 bg-glass-bg transition",
                "peer-checked:border-[#8f1113] peer-checked:bg-[#8f1113]",
              )}
            >
              {agreed && (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4 text-white"
                  aria-hidden="true"
                >
                  <path
                    d="M5 10.5l3.2 3.2L15 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>

            <span className="text-base leading-7 text-foreground">
              I agree and acknowledge the{" "}
              <a
                className={cn(
                  "cursor-pointer font-bold text-primary transition-colors",
                  "duration-200 hover:text-primary/60",
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

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="min-w-[160px] rounded-2xl px-6 py-6 text-base font-semibold"
            >
              Sign out
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!agreed || loading}
            onClick={onAccept}
            className={cn(
              "min-w-[160px] rounded-2xl px-6 py-6 text-base font-semibold transition-all",
              (!agreed || loading)
                ? "border-0 border-transparent bg-slate-300 text-slate-500 outline-none ring-0 hover:bg-slate-300"
                : `text-white ${accentClass}`,
            )}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
