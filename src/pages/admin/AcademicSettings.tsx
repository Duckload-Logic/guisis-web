import { useState, useEffect, useMemo } from "react";
import { GraduationCap, AlertTriangle, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetAcademicSettings,
  PutAcademicSettings,
} from "@/features/student-core/services/academicSettingsService";
import { useToast, usePageMetadata } from "@/context/hooks";
import { SelectField } from "@/components/ui/select-field";
import { LabeledSwitch } from "@/components/ui/labeled-switch";
import { cn } from "@/lib/utils";

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
  const [allowExpeditedIIR, setAllowExpeditedIIR] = useState<boolean>(false);

  // Derive yearEnd automatically — always start + 1.
  const yearEnd = yearStart + 1;

  useEffect(() => {
    if (current) {
      setYearStart(current.currentYearStart);
      setTerm(current.currentTerm);
      setAllowExpeditedIIR(current.allowExpeditedIIR);
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
        allowExpeditedIIR,
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
    (yearStart !== current.currentYearStart ||
      term !== current.currentTerm ||
      allowExpeditedIIR !== current.allowExpeditedIIR);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col space-y-8",
        "px-4 sm:px-6 md:px-8",
      )}
    >
      {/* Header (Wave 1) */}
      <div
        className="animate-fade-in-up flex items-start gap-4"
        style={{ animationDelay: "0.05s", animationFillMode: "both" }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="mt-0.5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
            Set the current active school year and term. All student COR uploads
            will be automatically validated against this setting by the OCR
            service.
          </h1>
        </div>
      </div>

      {/* Current active banner (Wave 2) */}
      {!isLoading && current && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-primary/20",
            "animate-fade-in-up bg-primary/5 px-5 py-4 shadow-sm",
          )}
          style={{ animationDelay: "0.10s", animationFillMode: "both" }}
        >
          <div className="rounded-full bg-primary/10 p-1.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          </div>
          <p className="text-sm font-medium">
            Active setting:&nbsp;
            <span className="font-bold tracking-tight text-primary">
              {current.currentYearStart}–{current.currentYearEnd}{" "}
              {TERM_LABELS[current.currentTerm]}
            </span>
          </p>
        </div>
      )}

      {/* Form card (Wave 3) */}
      <div
        className={cn(
          "bg-glass-bg/40 rounded-3xl border border-border backdrop-blur-2xl",
          "animate-fade-in-up space-y-6 px-6 py-8 shadow-md sm:px-8",
        )}
        style={{ animationDelay: "0.15s", animationFillMode: "both" }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* School year start */}
          <SelectField
            id="yearStart"
            label="School Year Start"
            options={yearOptions}
            value={yearStart}
            onChange={(val) => setYearStart(Number(val))}
          />

          {/* School year end — derived, read-only */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-foreground/80">
              School Year End
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-70">
                (auto)
              </span>
            </label>
            <div
              className={cn(
                "w-full rounded-xl border border-border/50 bg-muted/30 shadow-inner",
                "px-4 py-2.5 text-sm font-semibold text-muted-foreground",
              )}
            >
              {yearEnd}
            </div>
          </div>
        </div>

        {/* Term */}
        <SelectField
          id="term"
          label="Current Term"
          options={termOptions}
          value={term}
          onChange={(val) => setTerm(Number(val))}
        />

        {/* Expedited IIR Submission Toggle */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl",
            "border border-border/50 bg-muted/10 p-4",
          )}
        >
          <div className="space-y-1">
            <label className="block text-sm font-bold text-foreground/80">
              Allow Expedited IIR Submission
            </label>
            <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
              When enabled, shifters, transferees, and returning students can
              perform an "Express Submit" validating only basic profile info.
            </p>
          </div>
          <LabeledSwitch
            id="toggle-expedited-iir"
            checked={allowExpeditedIIR}
            onCheckedChange={setAllowExpeditedIIR}
          />
        </div>

        {/* Warning notice */}
        <div
          className={cn(
            "flex gap-3 rounded-xl border border-yellow-500/20",
            "mt-6 bg-yellow-500/5 px-4 py-4",
          )}
        >
          <div className="mt-0.5 h-fit rounded-full bg-yellow-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            <strong className="text-yellow-600">Warning:</strong> Changing this
            setting immediately affects how the OCR service validates COR
            uploads. CORs that do not match the active school year and term will
            be marked as unvalidated.
          </p>
        </div>

        {/* Save button */}
        <div className="border-t border-border/50 pt-4">
          <button
            id="btn-open-confirm-dialog"
            disabled={!isDirty || isLoading}
            onClick={() => {
              setConfirmText("");
              setDialogOpen(true);
            }}
            className={cn(
              "float-right w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold sm:w-auto sm:min-w-[200px]",
              "text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300",
              "hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md",
            )}
          >
            Save Changes
          </button>
          <div className="clear-both"></div>
        </div>
      </div>

      {/* ── Confirmation Dialog ────────────────────────────────────────── */}
      {dialogOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "animate-in fade-in bg-black/60 backdrop-blur-sm duration-200",
          )}
        >
          <div
            className={cn(
              "w-full max-w-md rounded-3xl border border-border/50",
              "animate-in zoom-in-95 bg-background/95 p-8 shadow-2xl backdrop-blur-xl duration-200",
            )}
          >
            {/* Dialog header */}
            <div className="mb-6 flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center",
                  "rounded-2xl border border-yellow-500/20 bg-yellow-500/15",
                )}
              >
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Confirm Setting Change
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  This action affects COR validation system-wide.
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm font-medium leading-relaxed text-foreground/80">
              You are about to set the active academic period to:
            </p>
            <p className="mb-6 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-center text-lg font-bold tracking-tight text-primary">
              {expectedConfirm}
            </p>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              To confirm, type exactly:
            </p>
            <p className="mb-4 w-fit select-all rounded-lg border bg-muted/50 px-3 py-1.5 font-mono text-sm font-semibold">
              {expectedConfirm}
            </p>
            <input
              id="confirm-text-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the confirmation string…"
              className={cn(
                "mb-6 w-full rounded-xl border bg-background/50 px-4",
                "py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2",
                confirmMatch
                  ? "border-green-500 bg-green-500/5 focus:ring-green-500/50"
                  : "border-border focus:ring-primary/50",
              )}
            />

            <div className="flex gap-3">
              <button
                id="btn-cancel-confirm"
                onClick={() => {
                  setDialogOpen(false);
                  setConfirmText("");
                }}
                className={cn(
                  "flex-1 rounded-xl border border-border/60 py-3",
                  "text-sm font-bold transition-all hover:border-border hover:bg-muted/50 active:scale-95",
                )}
              >
                Cancel
              </button>
              <button
                id="btn-submit-confirm"
                disabled={!confirmMatch || mutation.isPending}
                onClick={() => mutation.mutate()}
                className={cn(
                  "flex-1 rounded-xl bg-primary py-3 text-sm shadow-md",
                  "font-bold text-primary-foreground transition-all duration-300",
                  "hover:bg-primary/90 hover:shadow-lg active:scale-95",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-md",
                )}
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
