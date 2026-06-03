import { useState, useEffect, useMemo } from "react";
import { GraduationCap, AlertTriangle, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetAcademicSettings,
  PutAcademicSettings,
} from "@/features/student-core/services/academicSettingsService";
import { useToast, usePageMetadata } from "@/context/hooks";
import Dropdown from "@/components/form/Dropdown";

// ─── constants ───────────────────────────────────────────────────────────────

const QUERY_KEY = ["counselor", "academicSettings"] as const;

const TERM_LABELS: Record<number, string> = {
  1: "Semester 1",
  2: "Semester 2",
  3: "Summer",
};

const YEAR_RANGE = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - 2 + i,
);

// ─── component ───────────────────────────────────────────────────────────────

export default function AcademicSettings() {
  usePageMetadata({
    title: "Academic Settings",
    description:
      "Configure the current active school year and term used to " +
      "validate student Certificate of Registration (COR) uploads.",
  });

  const { triggerToast } = useToast();
  const queryClient = useQueryClient();

  // ── remote state ──────────────────────────────────────────────────────────

  const { data: current, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  // ── local form state ──────────────────────────────────────────────────────

  const [yearStart, setYearStart] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<number>(1);

  // Derive yearEnd automatically — always start + 1.
  const yearEnd = yearStart + 1;

  useEffect(() => {
    if (current) {
      setYearStart(current.currentYearStart);
      setTerm(current.currentTerm);
    }
  }, [current]);

  const yearOptions = useMemo(
    () => YEAR_RANGE.map((y) => ({ id: y, label: String(y) })),
    [],
  );

  const termOptions = useMemo(
    () => [1, 2, 3].map((t) => ({ id: t, label: TERM_LABELS[t] })),
    [],
  );

  // ── confirmation dialog state ─────────────────────────────────────────────

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // The exact string the admin must type to confirm the update.
  const expectedConfirm = `${yearStart}-${yearEnd} ${TERM_LABELS[term]}`;

  const confirmMatch = confirmText.trim() === expectedConfirm;

  // ── mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () =>
      PutAcademicSettings({
        currentYearStart: yearStart,
        currentYearEnd: yearEnd,
        currentTerm: term,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      triggerToast(
        "Academic setting updated. " +
          "Future COR uploads will be validated against " +
          `${yearStart}-${yearEnd} ${TERM_LABELS[term]}.`,
      );
      setDialogOpen(false);
      setConfirmText("");
    },
    onError: () => {
      triggerToast("Failed to update academic setting. Please try again.");
    },
  });

  // ── helpers ───────────────────────────────────────────────────────────────

  const isDirty =
    current &&
    (yearStart !== current.currentYearStart || term !== current.currentTerm);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={
            "flex h-12 w-12 shrink-0 items-center justify-center " +
            "rounded-2xl bg-primary/10"
          }
        >
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="mt-0.5 text-sm text-muted-foreground">
            Set the current active school year and term. All student COR uploads
            will be automatically validated against this setting by the OCR
            service.
          </h1>
        </div>
      </div>

      {/* Current active banner */}
      {!isLoading && current && (
        <div
          className={
            "flex items-center gap-3 rounded-xl border border-primary/20 " +
            "bg-primary/5 px-4 py-3"
          }
        >
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-medium">
            Active setting:&nbsp;
            <span className="text-primary">
              {current.currentYearStart}–{current.currentYearEnd}{" "}
              {TERM_LABELS[current.currentTerm]}
            </span>
          </p>
        </div>
      )}

      {/* Form card */}
      <div
        className={
          "rounded-2xl border border-border bg-card " +
          "space-y-5 px-6 py-5 shadow-sm"
        }
      >
        {/* School year start */}
        <Dropdown
          id="yearStart"
          label="School Year Start"
          options={yearOptions}
          value={yearStart}
          onChange={(val) => setYearStart(Number(val))}
        />

        {/* School year end — derived, read-only */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            School Year End
            <span className="ml-1 text-xs text-muted-foreground">(auto)</span>
          </label>
          <div
            className={
              "w-full rounded-lg border border-border/50 bg-muted " +
              "px-3 py-2 text-sm text-muted-foreground"
            }
          >
            {yearEnd}
          </div>
        </div>

        {/* Term */}
        <Dropdown
          id="term"
          label="Current Term"
          options={termOptions}
          value={term}
          onChange={(val) => setTerm(Number(val))}
        />

        {/* Warning notice */}
        <div
          className={
            "flex gap-2 rounded-lg border border-yellow-500/20 " +
            "bg-yellow-500/5 px-3 py-2.5"
          }
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
          <p className="text-xs text-muted-foreground">
            Changing this setting immediately affects how the OCR service
            validates COR uploads. CORs that do not match the active school year
            and term will be marked as unvalidated.
          </p>
        </div>

        {/* Save button */}
        <button
          id="btn-open-confirm-dialog"
          disabled={!isDirty || isLoading}
          onClick={() => {
            setConfirmText("");
            setDialogOpen(true);
          }}
          className={
            "w-full rounded-xl bg-primary py-2.5 text-sm font-semibold " +
            "text-primary-foreground transition-all" +
            "hover:bg-primary/90 active:scale-[.98]" +
            "disabled:cursor-not-allowed disabled:opacity-40"
          }
        >
          Save Changes
        </button>
      </div>

      {/* ── Confirmation Dialog ────────────────────────────────────────── */}
      {dialogOpen && (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center " +
            "bg-black/60 backdrop-blur-sm"
          }
        >
          <div
            className={
              "w-full max-w-md rounded-2xl border border-border " +
              "bg-card p-8 shadow-2xl"
            }
          >
            {/* Dialog header */}
            <div className="mb-5 flex items-center gap-3">
              <div
                className={
                  "flex h-10 w-10 items-center justify-center " +
                  "rounded-full bg-yellow-500/15"
                }
              >
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">
                  Confirm Setting Change
                </h2>
                <p className="text-xs text-muted-foreground">
                  This action affects COR validation system-wide.
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              You are about to set the active academic period to:
            </p>
            <p className="mb-5 rounded-lg bg-muted px-3 py-2 text-sm font-semibold">
              {expectedConfirm}
            </p>
            <p className="mb-2 text-sm text-muted-foreground">
              To confirm, type exactly:
            </p>
            <p className="mb-3 rounded bg-muted px-2 py-1 font-mono text-xs">
              {expectedConfirm}
            </p>
            <input
              id="confirm-text-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the confirmation string…"
              className={
                "mb-5 w-full rounded-lg border bg-background px-3 " +
                "py-2 text-sm focus:outline-none focus:ring-2" +
                (confirmMatch
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border focus:ring-primary")
              }
            />

            <div className="flex gap-3">
              <button
                id="btn-cancel-confirm"
                onClick={() => {
                  setDialogOpen(false);
                  setConfirmText("");
                }}
                className={
                  "flex-1 rounded-xl border border-border py-2.5 " +
                  "text-sm font-medium transition-all hover:bg-muted"
                }
              >
                Cancel
              </button>
              <button
                id="btn-submit-confirm"
                disabled={!confirmMatch || mutation.isPending}
                onClick={() => mutation.mutate()}
                className={
                  "flex-1 rounded-xl bg-primary py-2.5 text-sm " +
                  "font-semibold text-primary-foreground transition-all" +
                  "hover:bg-primary/90 active:scale-[.98]" +
                  "disabled:cursor-not-allowed disabled:opacity-40"
                }
              >
                {mutation.isPending ? "Saving…" : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
