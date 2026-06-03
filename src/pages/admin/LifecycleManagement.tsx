import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Archive,
  UserCheck,
  CheckSquare,
  Square,
  Search,
  ChevronDown,
  AlertTriangle,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCourses,
  useIIRPagination,
} from "@/features/iir/hooks";
import { Course, IIRProfileView } from "@/features/iir/types";
import { iirService } from "@/features/iir/services/service";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/shared";
import { Pagination } from "@/components/shared";
import { usePageMetadata } from "@/context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

// --- Constants ---------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();
const DIPLOMA_PREFIX = ["DIT", "DOMT"]; // codes from the seed

type SelectionMode = "none" | "page" | "all";

interface PendingAction {
  type: "graduate" | "archive" | "active";
  label: string;
  statusId: number;
  needsYear: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEligibleForGraduation(student: IIRProfileView): boolean {
  const code = student.course?.code?.toUpperCase() ?? "";
  const isDiploma = DIPLOMA_PREFIX.some((p) => code.startsWith(p));
  const isBachelor = code.startsWith("BS");
  return (
    (isDiploma && student.yearLevel === 3) ||
    (isBachelor && student.yearLevel === 4)
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectionBanner({
  mode,
  pageCount,
  totalCount,
  onSelectAll,
  onClearAll,
}: {
  mode: SelectionMode;
  pageCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  if (mode === "none") return null;

  return (
    <div
      className={cn(
        "animate-in fade-in mb-2 flex items-center justify-between",
        "rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5",
        "text-sm font-medium duration-300",
      )}
    >
      <span className="text-primary">
        {mode === "all"
          ? `All ${totalCount} matching students selected`
          : `${pageCount} students on this page selected`}
      </span>
      <div className="flex items-center gap-3">
        {mode === "page" && totalCount > pageCount && (
          <button
            onClick={onSelectAll}
            className="text-xs font-bold text-primary underline-offset-2 hover:underline"
          >
            Select all {totalCount} matching students
          </button>
        )}
        <button
          onClick={onClearAll}
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground",
            "transition-colors hover:text-destructive",
          )}
        >
          <X size={12} /> Clear
        </button>
      </div>
    </div>
  );
}

function StudentRow({
  student,
  isSelected,
  onToggle,
}: {
  student: IIRProfileView;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();

  const statusColors: Record<number, string> = {
    1: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    2: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    3: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    4: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    5: "text-red-600 bg-red-500/10 border-red-500/20",
  };

  return (
    <div
      className={cn(
        "hover:bg-glass-bg/40 grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-200",
        isSelected
          ? "border-primary/30 bg-primary/[0.02]"
          : "bg-glass-bg/20 border-glass-border",
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
          isSelected
            ? "border-primary bg-primary"
            : "border-glass-border bg-white/5",
        )}
      >
        {isSelected && <div className="h-2 w-2 rounded-[2px] bg-white" />}
      </div>

      {/* Student info */}
      <div className="grid min-w-0 grid-cols-[2fr_1.5fr_1fr_1fr] gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {student.lastName}, {student.firstName} {student.middleName ?? ""}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {student.email}
          </p>
        </div>
        <p className="self-center truncate text-xs text-muted-foreground">
          {student.course?.name ?? "—"}
        </p>
        <p className="self-center text-center text-xs text-muted-foreground">
          Year {student.yearLevel}
        </p>
        <div className="flex justify-center self-center">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase",
              statusColors[student.status?.id ?? 1],
            )}
          >
            {student.status?.name ?? "Active"}
          </span>
        </div>
      </div>

      {/* View link — stops propagation so clicking it doesn't toggle selection */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/admin/student-records/${student.iirId}`, {
            state: { student },
          });
        }}
        className={cn(
          "text-[11px] font-bold uppercase",
          "text-primary/50 transition-colors hover:text-primary",
        )}
      >
        View
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LifecycleManagement() {
  const { data: courses } = useCourses();

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [courseId, setCourseId] = useState(0);
  const [yearLevel, setYearLevel] = useState(0);
  const [enrollYear, setEnrollYear] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useIIRPagination({
    page,
    pageSize,
    search: debouncedSearch,
    courseId,
    yearLevel,
    statusId: 1, // Default: Active students only for lifecycle management
  });

  const students: IIRProfileView[] = data?.students ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.meta?.totalPages ?? 1;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none");

  const effectivelySelectedCount =
    selectionMode === "all" ? total - excludedIds.size : selectedIds.size;

  function toggleStudent(id: string) {
    if (selectionMode === "all") {
      // In "select all total" mode, toggling removes from selection (exclusion)
      setExcludedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      const nextMode =
        next.size === students.length
          ? "page"
          : next.size > 0
            ? "page"
            : "none";
      setSelectionMode(nextMode);
      return next;
    });
  }

  function selectPage() {
    setSelectedIds(new Set(students.map((s) => s.iirId)));
    setSelectionMode("page");
    setExcludedIds(new Set());
  }

  function selectAllTotal() {
    setSelectionMode("all");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }

  function clearAll() {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setSelectionMode("none");
  }

  function isStudentSelected(id: string): boolean {
    if (selectionMode === "all") return !excludedIds.has(id);
    return selectedIds.has(id);
  }

  // Graduation eligibility check on current selection
  const ineligibleCount = useMemo(() => {
    const visible = students.filter((s) => isStudentSelected(s.iirId));
    return visible.filter((s) => !isEligibleForGraduation(s)).length;
  }, [students, selectedIds, excludedIds, selectionMode]); // eslint-disable-line

  // Bulk action flow
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [graduationYear, setGraduationYear] = useState(CURRENT_YEAR);
  const [isProcessing, setIsProcessing] = useState(false);
  const [destructiveWarning, setDestructiveWarning] = useState(false);

  function initiateAction(action: PendingAction) {
    if (action.type === "graduate" && ineligibleCount > 0) {
      setPendingAction(action);
      setDestructiveWarning(true);
      return;
    }
    setPendingAction(action);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setIsProcessing(true);
    setDestructiveWarning(false);

    try {
      await iirService.bulkUpdateStudentStatus({
        iirIds: selectionMode === "all" ? undefined : [...selectedIds],
        excludedIirIds: selectionMode === "all" ? [...excludedIds] : undefined,
        selectAllMatching: selectionMode === "all",
        statusId: pendingAction.statusId,
        graduationYear: pendingAction.needsYear ? graduationYear : undefined,
        filters: {
          search: debouncedSearch,
          courseId,
          yearLevel,
          enrollYear,
        },
      });
      clearAll();
      setPage(1);
    } catch {
      alert("Failed to update students. Please try again.");
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  }

  usePageMetadata({
    title: "Records Lifecycle",
    description:
      "Bulk manage student record statuses — graduation, archival, and more.",
    badgeText: "Admin Management",
    badgeIcon: <GraduationCap className="h-4 w-4" />,
    isLoading,
  });

  const enrollYears = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
        {/* ── Filters ─────────────────────────────────────── */}
        <div
          className={cn(
            "rounded-3xl border border-glass-border bg-glass-bg p-6",
            "shadow-sm backdrop-blur-glass",
          )}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or student number…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={cn(
                  "h-11 w-full rounded-xl border border-glass-border bg-white/5",
                  "pl-9 pr-4 text-sm transition-colors focus:border-primary/30",
                  "focus:outline-none",
                )}
              />
            </div>

            {/* Course */}
            <div className="relative">
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(Number(e.target.value));
                  setPage(1);
                }}
                className={cn(
                  "h-11 w-full appearance-none rounded-xl border",
                  "border-glass-border bg-white/5 px-3 pr-8 text-sm",
                  "transition-colors focus:border-primary/30 focus:outline-none",
                )}
              >
                <option value={0}>All Courses</option>
                {courses?.map((c: Course) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.code}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={cn(
                  "pointer-events-none absolute right-3 top-1/2 h-4 w-4",
                  "-translate-y-1/2 text-muted-foreground",
                )}
              />
            </div>

            {/* Year Level */}
            <div className="relative">
              <select
                value={yearLevel}
                onChange={(e) => {
                  setYearLevel(Number(e.target.value));
                  setPage(1);
                }}
                className={cn(
                  "h-11 w-full appearance-none rounded-xl border",
                  "border-glass-border bg-white/5 px-3 pr-8 text-sm",
                  "transition-colors focus:border-primary/30 focus:outline-none",
                )}
              >
                <option value={0}>All Year Levels</option>
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
              <ChevronDown
                className={cn(
                  "pointer-events-none absolute right-3 top-1/2 h-4 w-4",
                  "-translate-y-1/2 text-muted-foreground",
                )}
              />
            </div>

            {/* Enrollment year */}
            <div className="relative">
              <select
                value={enrollYear}
                onChange={(e) => {
                  setEnrollYear(Number(e.target.value));
                  setPage(1);
                }}
                className={cn(
                  "h-11 w-full appearance-none rounded-xl border",
                  "border-glass-border bg-white/5 px-3 pr-8 text-sm",
                  "transition-colors focus:border-primary/30 focus:outline-none",
                )}
              >
                <option value={0}>All Enrollment Years</option>
                {enrollYears.map((y) => (
                  <option
                    key={y}
                    value={y}
                  >
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={cn(
                  "pointer-events-none absolute right-3 top-1/2 h-4 w-4",
                  "-translate-y-1/2 text-muted-foreground",
                )}
              />
            </div>
          </div>
        </div>

        {/* ── List ────────────────────────────────────────── */}
        <div className="relative min-h-[400px]">
          {isLoading && (
            <div
              className={cn(
                "bg-glass-bg/5 absolute inset-0 z-20 flex items-center",
                "justify-center rounded-[32px] backdrop-blur-[2px]",
              )}
            >
              <Spinner size="lg" />
            </div>
          )}

          <div
            className={cn(
              "space-y-2 transition-all duration-500",
              isLoading && "pointer-events-none opacity-40 blur-[1px]",
            )}
          >
            {/* Header row */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-2">
              {/* Select All Page toggle */}
              <button
                onClick={
                  selectionMode === "page" &&
                  selectedIds.size === students.length
                    ? clearAll
                    : selectPage
                }
                className="flex h-5 w-5 items-center justify-center"
              >
                {selectionMode !== "none" &&
                selectedIds.size === students.length ? (
                  <CheckSquare
                    size={16}
                    className="text-primary"
                  />
                ) : (
                  <Square
                    size={16}
                    className="text-muted-foreground"
                  />
                )}
              </button>

              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Student
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Course
                </p>
                <p
                  className={cn(
                    "text-center text-[10px] font-bold uppercase",
                    "text-muted-foreground",
                  )}
                >
                  Year
                </p>
                <p
                  className={cn(
                    "text-center text-[10px] font-bold uppercase",
                    "text-muted-foreground",
                  )}
                >
                  Status
                </p>
              </div>

              <p
                className={cn(
                  "select-none text-[10px] font-bold uppercase",
                  "text-muted-foreground opacity-0",
                )}
              >
                View
              </p>
            </div>

            <SelectionBanner
              mode={selectionMode}
              pageCount={selectedIds.size}
              totalCount={total}
              onSelectAll={selectAllTotal}
              onClearAll={clearAll}
            />

            {students.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Users className="mb-4 h-16 w-16 text-muted-foreground/20" />
                <p className="text-lg font-bold text-muted-foreground">
                  No students found
                </p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              students.map((s) => (
                <StudentRow
                  key={s.iirId}
                  student={s}
                  isSelected={isStudentSelected(s.iirId)}
                  onToggle={() => toggleStudent(s.iirId)}
                />
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-1 pt-4">
              <p className="text-xs text-muted-foreground">
                {total} total records
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Bulk Action Bar ─────────────────────── */}
      {effectivelySelectedCount > 0 && (
        <div
          className={cn(
            "animate-in fade-in slide-in-from-bottom-6 duration-400 fixed",
            "bottom-8 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4",
          )}
        >
          <div
            className={cn(
              "bg-glass-bg/90 overflow-hidden rounded-3xl border",
              "border-primary/20 shadow-2xl backdrop-blur-xl",
            )}
          >
            <div className="border-glass-border/40 flex items-center gap-3 border-b px-5 py-3">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl",
                  "bg-primary text-xs font-bold text-white",
                )}
              >
                {effectivelySelectedCount > 99
                  ? "99+"
                  : effectivelySelectedCount}
              </div>
              <p className="text-sm font-bold">
                {selectionMode === "all"
                  ? "All matching"
                  : effectivelySelectedCount}{" "}
                students selected
              </p>
              <button
                onClick={clearAll}
                className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 p-3">
              <button
                onClick={() =>
                  initiateAction({
                    type: "graduate",
                    label: "Graduate",
                    statusId: 2,
                    needsYear: true,
                  })
                }
                disabled={isProcessing}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border",
                  "border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs",
                  "font-bold uppercase text-emerald-600",
                  "transition-all duration-300 hover:bg-emerald-500",
                  "hover:text-white disabled:opacity-40",
                )}
              >
                <GraduationCap size={15} />
                Graduate
              </button>

              <button
                onClick={() =>
                  initiateAction({
                    type: "archive",
                    label: "Archive",
                    statusId: 4,
                    needsYear: false,
                  })
                }
                disabled={isProcessing}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border",
                  "border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs",
                  "font-bold uppercase text-amber-600",
                  "transition-all duration-300 hover:bg-amber-500",
                  "hover:text-white disabled:opacity-40",
                )}
              >
                <Archive size={15} />
                Archive
              </button>

              <button
                onClick={() =>
                  initiateAction({
                    type: "active",
                    label: "Set Active",
                    statusId: 1,
                    needsYear: false,
                  })
                }
                disabled={isProcessing}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-primary/20",
                  "bg-primary/10 px-4 py-2 text-xs font-bold uppercase",
                  "tracking-wider text-primary transition-all duration-300",
                  "hover:bg-primary hover:text-white disabled:opacity-40",
                )}
              >
                <UserCheck size={15} />
                Set Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Destructive Warning Modal ────────────────────── */}
      <AlertDialog
        open={destructiveWarning}
        onOpenChange={setDestructiveWarning}
      >
        <AlertDialogContent className="max-w-md rounded-3xl border-amber-500/20 bg-glass-bg backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mb-2 flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center",
                  "rounded-2xl bg-amber-500/10 text-amber-500",
                )}
              >
                <AlertTriangle size={26} />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-bold leading-tight">
                  Some students aren't ready to graduate
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Your selection includes{" "}
                  <strong className="text-amber-600">
                    {ineligibleCount} student{ineligibleCount !== 1 ? "s" : ""}
                  </strong>{" "}
                  who have not yet reached their final year.
                </p>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700">
                  <p className="mb-1 font-semibold">
                    Graduation is only valid for:
                  </p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>Diploma programs — 3rd Year students</li>
                    <li>Bachelor's programs — 4th Year students</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  If you continue, <strong>only eligible students</strong> will
                  be graduated. Ineligible students will be skipped
                  automatically. This action <strong>cannot be undone</strong> —
                  graduated records are permanently locked.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingAction?.needsYear && (
            <div className="py-2">
              <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">
                Graduation Year
              </label>
              <Input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                min={2000}
                max={2100}
                className="h-11 rounded-xl border-primary/10 bg-white/5 focus:border-primary/30"
              />
            </div>
          )}

          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel className="hover:bg-glass-bg/50 rounded-xl border-glass-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing}
              className={cn(
                "rounded-xl bg-amber-500 px-6 font-bold text-white shadow-lg",
                "shadow-amber-500/20 hover:bg-amber-600",
              )}
            >
              {isProcessing ? "Processing…" : "Graduate Eligible Students"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm Modal (Archive / Active) ─────────────── */}
      <AlertDialog
        open={!!pendingAction && !destructiveWarning}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-3xl border-glass-border bg-glass-bg backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm — {pendingAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark{" "}
              <strong>
                {effectivelySelectedCount} student
                {effectivelySelectedCount !== 1 ? "s" : ""}
              </strong>{" "}
              as <strong>{pendingAction?.label}</strong>.
              {pendingAction?.type === "archive" && (
                <> This will lock their records from further edits.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingAction?.needsYear && (
            <div className="py-2">
              <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">
                Graduation Year
              </label>
              <Input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                min={2000}
                max={2100}
                className="h-11 rounded-xl border-primary/10 bg-white/5 focus:border-primary/30"
              />
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:bg-glass-bg/50 rounded-xl border-glass-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing}
              className="rounded-xl bg-primary font-bold text-white"
            >
              {isProcessing ? "Processing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
