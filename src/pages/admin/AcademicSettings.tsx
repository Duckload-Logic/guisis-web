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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

export default function AcademicSettings() {
  usePageMetadata({
    title: "Academic Settings",
    description:
      "Configure the current active school year and term used to " +
      "validate student Certificate of Registration (COR) uploads.",
  });

  const { triggerToast } = useToast();
  const queryClient = useQueryClient();

  const { data: current, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  const [yearStart, setYearStart] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<number>(1);
  const [allowExpeditedIIR, setAllowExpeditedIIR] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const yearEnd = yearStart + 1;

  useEffect(() => {
    if (current) {
      setYearStart(current.currentYearStart);
      setTerm(current.currentTerm);
      setAllowExpeditedIIR(current.allowExpeditedIIR);
    }
  }, [current]);

  const yearOptions = useMemo(
    () =>
      YEAR_RANGE.map((y) => ({
        id: y,
        label: `A.Y. ${y}–${y + 1}`,
      })),
    [],
  );

  const termOptions = useMemo(
    () => [1, 2, 3].map((t) => ({ id: t, label: TERM_LABELS[t] })),
    [],
  );

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
          `A.Y. ${yearStart}–${yearEnd} ${TERM_LABELS[term]}.`,
      );
      setDialogOpen(false);
    },
    onError: () => {
      triggerToast("Failed to update academic setting. Please try again.");
    },
  });

  const isDirty =
    current &&
    (yearStart !== current.currentYearStart ||
      term !== current.currentTerm ||
      allowExpeditedIIR !== current.allowExpeditedIIR);

  if (isLoading) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col space-y-8 px-4",
          "sm:px-6 md:px-8",
        )}
      >
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="space-y-6 rounded-3xl border border-border p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="flex justify-end pt-4">
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col space-y-8 px-4",
        "sm:px-6 md:px-8",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center",
            "rounded-2xl bg-primary/10 shadow-inner",
          )}
        >
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1
            className={cn(
              "mt-0.5 max-w-2xl text-sm font-medium leading-relaxed",
              "text-muted-foreground",
            )}
          >
            Set the current active school year and term. All student COR uploads
            will be automatically validated against this setting by the OCR
            service.
          </h1>
        </div>
      </div>

      {/* Current active banner */}
      {current && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-primary/20",
            "bg-primary/5 px-5 py-4 shadow-sm",
          )}
        >
          <div className="rounded-full bg-primary/10 p-1.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          </div>
          <p className="text-sm font-medium">
            Active setting:&nbsp;
            <span className="font-bold tracking-tight text-primary">
              A.Y. {current.currentYearStart}–{current.currentYearEnd}{" "}
              {TERM_LABELS[current.currentTerm]}
            </span>
          </p>
        </div>
      )}

      {/* Form card */}
      <div
        className={cn(
          "rounded-3xl border border-border bg-glass-bg/40 p-6 shadow-md",
          "backdrop-blur-2xl sm:p-8 space-y-6",
        )}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Academic Year Selector */}
          <SelectField
            id="yearStart"
            label="Academic Year"
            options={yearOptions}
            value={yearStart}
            onChange={(val) => setYearStart(Number(val))}
          />

          {/* Term Selector */}
          <SelectField
            id="term"
            label="Active Term"
            options={termOptions}
            value={term}
            onChange={(val) => setTerm(Number(val))}
          />
        </div>

        {/* Expedited IIR Submission Toggle */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border",
            "border-border/50 bg-muted/10 p-4",
          )}
        >
          <div className="space-y-1">
            <label className="block text-sm font-bold text-foreground/80">
              Allow Expedited IIR Submission
            </label>
            <p
              className={cn(
                "max-w-lg text-xs leading-relaxed text-muted-foreground",
              )}
            >
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
            "flex gap-3 rounded-xl border border-amber-500/20",
            "bg-amber-500/5 px-4 py-4",
          )}
        >
          <div className="mt-0.5 h-fit rounded-full bg-amber-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          </div>
          <p
            className={cn(
              "text-xs font-medium leading-relaxed text-muted-foreground",
            )}
          >
            <strong className="text-amber-600">Warning:</strong> Changing this
            setting immediately affects how the OCR service validates COR
            uploads. CORs that do not match the active school year and term
            will be marked as unvalidated.
          </p>
        </div>

        {/* Save button with Flexbox */}
        <div className="flex justify-end border-t border-border/50 pt-4">
          <Button
            id="btn-open-confirm-dialog"
            type="button"
            disabled={!isDirty || isLoading}
            onClick={() => setDialogOpen(true)}
            className="w-full rounded-xl sm:w-auto sm:min-w-[180px]"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Accessible Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6 sm:p-8">
          <DialogHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center",
                  "rounded-xl border border-amber-500/20 bg-amber-500/15",
                )}
              >
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle
                className="text-base font-bold tracking-tight sm:text-lg"
              >
                Confirm Academic Setting Change
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              This action immediately updates COR validation rules system-wide.
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4",
              "text-xs",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Setting:</span>
              <span className="font-semibold text-foreground">
                A.Y. {current?.currentYearStart}–{current?.currentYearEnd}{" "}
                {TERM_LABELS[current?.currentTerm || 1]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New Setting:</span>
              <Badge variant="default" className="font-bold">
                A.Y. {yearStart}–{yearEnd} {TERM_LABELS[term]}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expedited IIR:</span>
              <Badge
                variant={allowExpeditedIIR ? "default" : "secondary"}
                className="font-bold"
              >
                {allowExpeditedIIR ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <DialogFooter
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={mutation.isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-confirm"
              type="button"
              variant="default"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="rounded-xl font-bold shadow-md"
            >
              {mutation.isPending ? "Saving..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
