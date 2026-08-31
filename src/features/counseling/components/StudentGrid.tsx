import { useMemo, useRef, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";

import { Spinner } from "@/components/shared";
import {
  IIRProfileView,
  ORDER_BY_OPTIONS,
  StudentFilterCounts,
} from "@/features/iir/types";
import { ProfileFemale, ProfileMale } from "@/assets/icons";
import { NothingFound } from "@/components/shared/NothingFound";
import { Table } from "@/components/shared/Table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Input } from "@/components/ui/input";
import SearchInput from "@/components/form/SearchInput";
import { getIIRTwoByTwoPhoto } from "@/features/iir/utils/twoByTwoPhoto";
import { getProfilePictureUrl } from "@/lib/profilePicture";

interface StudentGridProps {
  students: IIRProfileView[];
  totalMatchingStudents: number;
  filterCounts?: StudentFilterCounts;
  isStudentsLoading: boolean;
  onViewClick: (student: IIRProfileView) => void;
  viewMode: "tile" | "list";
  onViewModeChange: (mode: "tile" | "list") => void;
  yearLevels: { id: number; name: string }[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedStatusId: string;
  setSelectedStatusId: (value: string) => void;
  selectedProgramId: string;
  setSelectedProgramId: (value: string) => void;
  selectedYearLevelId: string;
  setSelectedYearLevelId: (value: string) => void;
  selectedSort: StudentSortKey;
  setSelectedSort: (value: StudentSortKey) => void;
  selectedOrder: StudentSortOrder;
  setSelectedOrder: (value: StudentSortOrder) => void;
  onExportCSV: () => void;
}

type StudentSortOrder = "asc" | "desc";
type StudentSortKey = keyof typeof ORDER_BY_OPTIONS;

function getStudentName(student: IIRProfileView) {
  const parts = [];
  const lastNameWithSuffix = `${student.lastName || ""}${
    student.suffixName ? ` ${student.suffixName}` : ""
  }`.trim();
  
  if (lastNameWithSuffix) parts.push(lastNameWithSuffix);
  
  const firstNameWithMI = `${student.firstName || ""}${
    student.middleName
      ? ` ${student.middleName.charAt(0).toUpperCase()}.`
      : ""
  }`.trim();
  
  if (firstNameWithMI) parts.push(firstNameWithMI);
  
  return parts.join(", ");
}

function getStudentTwoByTwoPhoto(student: IIRProfileView) {
  if (student.profilePicture) {
    return getProfilePictureUrl(student.profilePicture);
  }

  return getIIRTwoByTwoPhoto({
    iirId: student.iirId,
    userId: student.userId,
    studentNumber: student.studentNumber || null,
    email: student.email || null,
  });
}

function renderStudentAvatar(
  student: IIRProfileView,
  className: string,
  iconClassName: string,
) {
  const photoUrl = getStudentTwoByTwoPhoto(student);

  return photoUrl ? (
    <img
      src={photoUrl}
      alt={`${getStudentName(student) || "Student"} 2x2 photo`}
      className={className}
    />
  ) : student.gender?.id === 1 || student?.gender?.id !== 2 ? (
    <ProfileMale className={iconClassName} />
  ) : (
    <ProfileFemale className={iconClassName} />
  );
}

export default function StudentGrid({
  students,
  totalMatchingStudents,
  filterCounts,
  isStudentsLoading,
  onViewClick,
  viewMode,
  onViewModeChange,
  yearLevels,
  searchTerm,
  setSearchTerm,
  selectedStatusId,
  setSelectedStatusId,
  selectedProgramId,
  setSelectedProgramId,
  selectedYearLevelId,
  setSelectedYearLevelId,
  selectedSort,
  setSelectedSort,
  selectedOrder,
  setSelectedOrder,
  onExportCSV,
}: StudentGridProps) {
  const sortedVisibleStudents = students;

  const statusOptions = useMemo(() => {
    const counts = filterCounts?.statuses || [];

    return [
      { id: "all", name: "All Statuses", count: totalMatchingStudents },
      ...counts.map((status) => ({
        id: String(status.id),
        name: status.name,
        count: status.count,
      })),
    ].map((status) => ({
      ...status,
      displayName:
        status.id === "all" ? status.name : `${status.name} (${status.count})`,
      disabled: status.id !== "all" && status.count === 0,
    }));
  }, [filterCounts?.statuses, totalMatchingStudents]);

  const programOptions = useMemo(() => {
    const counts = filterCounts?.programs || [];

    return [
      { id: "all", name: "All Programs", count: totalMatchingStudents },
      ...counts.map((program) => ({
        id: String(program.id),
        name: program.code || program.name,
        count: program.count,
      })),
    ].map((program) => ({
      ...program,
      displayName:
        program.id === "all" ? program.name : `${program.name} (${program.count})`,
      disabled: program.id !== "all" && program.count === 0,
    }));
  }, [filterCounts?.programs, totalMatchingStudents]);

  const yearLevelOptions = useMemo(() => {
    const countByYear = new Map(
      (filterCounts?.yearLevels || []).map((year) => [year.id, year.count]),
    );

    return [
      { id: "all", name: "All Year Levels", count: totalMatchingStudents },
      ...yearLevels.map((year) => ({
        id: String(year.id),
        name: year.name,
        count: countByYear.get(year.id) || 0,
      })),
    ].map((year) => ({
      ...year,
      displayName:
        year.id === "all" ? year.name : `${year.name} (${year.count})`,
      disabled: year.id !== "all" && year.count === 0,
    }));
  }, [filterCounts?.yearLevels, totalMatchingStudents, yearLevels]);

  const sortOptions = useMemo(
    () => [
      { id: "lastName", displayName: "Student Name" },
      { id: "studentId", displayName: "Student Number" },
      { id: "programId", displayName: "Program" },
      { id: "yearLevel", displayName: "Year Level" },
    ],
    [],
  );

  const orderOptions = useMemo(
    () => [
      { id: "asc", displayName: "Ascending" },
      { id: "desc", displayName: "Descending" },
    ],
    [],
  );

  if (isStudentsLoading || !students) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }


  const genderColors: Record<number, string> = {
    1: "bg-blue-500",
    2: "bg-pink-500",
  };

  const statusColors: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-green-500/20",
    2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    3: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    4: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    5: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleViewClick = (
    student: IIRProfileView,
    event?: MouseEvent<HTMLDivElement | HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    onViewClick(student);
  };

  const renderSortableHeader = (label: string, sortKey: StudentSortKey) => {
    const isActive = selectedSort === sortKey;
    const Icon = isActive ? (selectedOrder === "desc" ? ArrowDown : ArrowUp) : ArrowUp;

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedSort(sortKey);
          setSelectedOrder(isActive && selectedOrder === "asc" ? "desc" : "asc");
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2 py-1 whitespace-nowrap outline-none",
          "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
          isActive ? "text-[#800000] dark:text-red-400" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", isActive ? "opacity-100" : "opacity-40")}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </button>
    );
  };

  const searchInput = (
    <SearchInput
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      placeholder="Search by name, email, or student number..."
      className="h-11 border-border/70 bg-muted/50 dark:border-white/10 dark:bg-white/[0.04]"
    />
  );

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-xl border border-glass-border bg-background/70 p-1 shadow-md">
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3",
          "text-[11px] font-semibold transition-all",
          viewMode === "list"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-pressed={viewMode === "list"}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("tile")}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3",
          "text-[11px] font-semibold transition-all",
          viewMode === "tile"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-pressed={viewMode === "tile"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Cards
      </button>
    </div>
  );

  const exportButton = (
    <Button
      type="button"
      variant="outline"
      onClick={onExportCSV}
      className="h-10 rounded-xl border-primary/30 px-4 text-sm font-semibold text-primary shadow-md"
    >
      Export CSV
    </Button>
  );

  const columns = [
    {
      header: (
        <div className="w-full flex items-center justify-start pl-2">
          {renderSortableHeader("Student Name", "lastName")}
        </div>
      ),
      className: "w-[25%] min-w-[240px] px-2 py-3",
      render: (student: IIRProfileView) => (
        <div className="flex items-center gap-3 pl-2">
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center",
              "justify-center overflow-hidden rounded-xl",
              "border border-primary/20 bg-glass-bg/50",
            )}
          >
            {renderStudentAvatar(
              student,
              "h-full w-full object-cover",
              "h-4/5 w-4/5 text-primary/80",
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {getStudentName(student) || "Unnamed Student"}
            </p>
            {!student.isCompleted && (
              <span
                className={cn(
                  "inline-block mt-0.5 rounded bg-amber-500/10",
                  "px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  "text-amber-700 dark:text-amber-300",
                )}
              >
                Expedited
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: (
        <div className="w-full flex items-center justify-start">
          {renderSortableHeader("Student Number", "studentId")}
        </div>
      ),
      className: "w-[15%] min-w-[170px] px-2 py-3",
      render: (student: IIRProfileView) => (
        <span className="text-xs font-bold uppercase text-primary/60 px-2">
          {student.studentNumber}
        </span>
      ),
    },
    {
      header: (
        <div className="w-full flex items-center justify-start">
          <span className="px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Email Address
          </span>
        </div>
      ),
      className: "w-[22%] min-w-[240px] px-2 py-3",
      render: (student: IIRProfileView) => (
        <span className="text-sm font-medium text-foreground/80 px-2 truncate block">
          {student.email}
        </span>
      ),
    },
    {
      header: (
        <div className="w-full pr-1">
          <SelectField
            label=""
            options={programOptions}
            value={selectedProgramId}
            onChange={(val) => setSelectedProgramId(String(val))}
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
              selectedProgramId === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000] dark:text-red-400"
            )}
          />
        </div>
      ),
      className: "w-[14%] min-w-[180px] px-2 py-3",
      render: (student: IIRProfileView) => (
        <span className="text-sm font-semibold text-primary/80 px-2">
          {student.program.code}
        </span>
      ),
    },
    {
      header: (
        <div className="w-full pr-1">
          <SelectField
            label=""
            options={yearLevelOptions}
            value={selectedYearLevelId}
            onChange={(val) => setSelectedYearLevelId(String(val))}
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
              selectedYearLevelId === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000] dark:text-red-400"
            )}
          />
        </div>
      ),
      className: "w-[12%] min-w-[160px] px-2 py-3",
      render: (student: IIRProfileView) => {
        const yrName =
          yearLevels.find((level) => level.id === student.yearLevel)?.name.split(" ")[0] || "N/A";
        return (
          <span className="text-xs text-muted-foreground px-2">
            {yrName} Year
          </span>
        );
      },
    },
    {
      header: (
        <div className="w-full pr-4">
          <SelectField
            label=""
            options={statusOptions}
            value={selectedStatusId}
            onChange={(val) => setSelectedStatusId(String(val))}
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
              selectedStatusId === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000] dark:text-red-400"
            )}
          />
        </div>
      ),
      className: "w-[12%] min-w-[170px] px-2 py-3",
      render: (student: IIRProfileView) => (
        <div className="px-2">
          <span
            className={cn(
              "inline-block rounded-xl border px-2.5 py-0.5",
              "text-[10px] font-bold uppercase shadow-md",
              statusColors[student.status?.id] || "bg-gray-200",
            )}
          >
            {student.status?.name || "Unknown"}
          </span>
        </div>
      ),
    },
  ];

  const renderMobileItem = (student: IIRProfileView) => {
    const yrName =
      yearLevels.find((level) => level.id === student.yearLevel)?.name.split(" ")[0] || "N/A";

    return (
      <div
        key={student.email}
        className={cn(
          "flex flex-col gap-3 pb-4 pt-4",
          "border-b border-glass-border/20 last:border-b-0 last:pb-0",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center",
                "justify-center overflow-hidden rounded-xl",
                "border border-primary/20 bg-glass-bg/50",
              )}
            >
              {renderStudentAvatar(
                student,
                "h-full w-full object-cover",
                "h-4/5 w-4/5 text-primary/80",
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {getStudentName(student) || "Unnamed Student"}
              </p>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {student.studentNumber}
              </p>
              {!student.isCompleted && (
                <span
                  className={cn(
                    "inline-block mt-0.5 rounded bg-amber-500/10 px-1.5",
                    "py-0.5 text-[8px] font-bold uppercase",
                    "text-amber-700 dark:text-amber-300",
                  )}
                >
                  Expedited
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              "rounded-xl border px-2 py-0.5 text-[9px] font-bold uppercase shadow-md",
              statusColors[student.status?.id] || "bg-gray-200",
            )}
          >
            {student.status?.name || "Unknown"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div>
            <p className="text-[9px] font-bold uppercase text-muted-foreground/60">
              Program & Year
            </p>
            <p className="font-semibold text-foreground/80">
              {student.program.code} - {yrName} Yr
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => handleViewClick(student, event)}
              className={cn(
                "min-h-8 gap-1.5 rounded-xl border-primary/20",
                "bg-primary/10 px-3 py-1.5 text-[10px] font-bold",
                "uppercase text-primary hover:bg-primary hover:text-white",
              )}
            >
              <Eye size={12} />
              View
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      
      {viewMode === "list" ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-glass-border bg-glass-bg/50 px-4 py-3 shadow-md backdrop-blur-glass">
          <div className="w-full sm:max-w-md">
            {searchInput}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {exportButton}
            {viewToggle}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-glass-border bg-glass-bg/50 px-4 py-4 shadow-md backdrop-blur-glass">
          <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-end gap-3">
              <div className="w-full md:w-[260px] xl:w-[300px]">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Search
                </label>
                {searchInput}
              </div>
              <div className="w-full sm:w-[150px] xl:flex-1">
                <SelectField
                  label="Program"
                  options={programOptions}
                  value={selectedProgramId}
                  onChange={(val) => setSelectedProgramId(String(val))}
                  labelKey="displayName"
                  enabled={!isStudentsLoading}
                />
              </div>
              <div className="w-full sm:w-[150px] xl:flex-1">
                <SelectField
                  label="Year Level"
                  options={yearLevelOptions}
                  value={selectedYearLevelId}
                  onChange={(val) => setSelectedYearLevelId(String(val))}
                  labelKey="displayName"
                  enabled={!isStudentsLoading}
                />
              </div>
              <div className="w-full sm:w-[150px] xl:flex-1">
                <SelectField
                  label="Status"
                  options={statusOptions}
                  value={selectedStatusId}
                  onChange={(val) => setSelectedStatusId(String(val))}
                  labelKey="displayName"
                  enabled={!isStudentsLoading}
                />
              </div>
              <div className="w-full sm:w-[150px] xl:flex-1">
                <SelectField
                  label="Sort By"
                  options={sortOptions}
                  value={selectedSort}
                  onChange={(val) => setSelectedSort(String(val) as StudentSortKey)}
                  labelKey="displayName"
                  enabled={!isStudentsLoading}
                />
              </div>
              <div className="w-full sm:w-[150px] xl:flex-1">
                <SelectField
                  label="Order"
                  options={orderOptions}
                  value={selectedOrder}
                  onChange={(val) => setSelectedOrder(val as StudentSortOrder)}
                  labelKey="displayName"
                  enabled={!isStudentsLoading}
                />
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-3 2xl:w-auto shrink-0 pb-[1px]">
              {exportButton}
              {viewToggle}
            </div>
          </div>
        </div>
      )}

      {sortedVisibleStudents.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-glass-border bg-glass-bg p-8 text-center shadow-md backdrop-blur-glass">
          <NothingFound message="No students match the current search or filters." />
          <div className="flex flex-wrap justify-center gap-2">
            {searchTerm.trim() && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSearchChange("")}
                className="rounded-xl shadow-md"
              >
                Clear search
              </Button>
            )}
            {(selectedStatusId !== "all" ||
              selectedProgramId !== "all" ||
              selectedYearLevelId !== "all") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedStatusId("all");
                  setSelectedProgramId("all");
                  setSelectedYearLevelId("all");
                }}
                className="rounded-xl shadow-md"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "tile" ? (
        <div
          className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
          )}
        >
          {sortedVisibleStudents.map((student) => (
            <div
              key={student.email}
              className={cn(
                "group relative cursor-pointer overflow-hidden hover:bg-glass-bg/40",
                "rounded-xl border border-glass-border bg-glass-bg p-3 md:p-6",
                "shadow-md backdrop-blur-glass transition-all duration-500",
                "hover:-translate-y-1.5 hover:border-primary/30",
                "hover:shadow-md active:scale-[0.98]",
              )}
              onClick={() => onViewClick(student)}
            >
              <div
                className={cn(
                  "absolute right-4 top-4 rounded-xl border px-3 py-1",
                  "hidden text-[10px] font-bold uppercase shadow-md md:block",
                  statusColors[student.status?.id] || "bg-gray-200",
                )}
              >
                {student.status?.name || "Unknown"}
              </div>

              <div
                className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-xl",
                  "bg-primary/5 blur-3xl transition-colors duration-500",
                  "group-hover:bg-primary/10",
                )}
              />

              <div className="relative z-10 flex flex-col gap-2 md:gap-5">
                <div className="flex flex-col items-center gap-2 text-center md:gap-4">
                  <div className="group/avatar relative">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl bg-primary/20 opacity-0",
                        "blur-2xl transition-all duration-700",
                        "group-hover/avatar:bg-primary/30 group-hover:opacity-100",
                      )}
                    />

                    <div
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center",
                        "overflow-hidden rounded-xl border-[3px] md:h-28 md:w-28",
                        "border-primary/20 bg-glass-bg/50 shadow-md md:border-[6px]",
                        "transition-transform duration-500",
                      )}
                    >
                      {renderStudentAvatar(
                        student,
                        "h-full w-full object-cover",
                        "h-4/5 w-4/5 text-primary/80",
                      )}
                    </div>

                    <div
                      className={cn(
                        "absolute bottom-0 right-0 flex h-5 w-5",
                        "items-center justify-center rounded-xl border border-white/20 bg-card",
                        "shadow-md backdrop-blur-md transition-transform duration-500 md:h-8 md:w-8",
                        "group-hover/avatar:translate-x-1 group-hover/avatar:translate-y-1",
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-xl shadow-md md:h-3.5 md:w-3.5",
                          genderColors[student?.gender?.id] || "bg-gray-400",
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    <h3
                      className={cn(
                        "line-clamp-1 text-xs font-bold tracking-tight md:text-xl",
                        "text-foreground transition-colors",
                        "group-hover:text-primary",
                      )}
                    >
                      {getStudentName(student) || "Unnamed Student"}
                    </h3>
                    <p className="text-[8px] font-bold uppercase text-primary/60 md:text-[11px]">
                      {student.studentNumber}
                    </p>
                    {!student.isCompleted && (
                      <div className="mt-1 flex justify-center">
                        <span
                          className={cn(
                            "rounded bg-amber-500/10 px-1.5 py-0.5",
                            "text-[8px] font-bold uppercase",
                            "text-amber-700 dark:text-amber-300",
                          )}
                        >
                          Expedited
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center pt-0.5 md:hidden">
                      <span
                        className={cn(
                          "rounded-xl border px-1.5 py-0.5",
                          "text-[7px] font-bold uppercase shadow-md",
                          statusColors[student.status?.id] || "bg-gray-200",
                        )}
                      >
                        {student.status?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "border-t border-glass-border/30 pt-2",
                    "flex flex-col gap-1.5 md:gap-3",
                  )}
                >
                  <div className="hidden flex-col gap-0.5 md:flex">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground opacity-60">
                      Email Address
                    </span>
                    <span className="truncate text-sm font-medium text-foreground/80">
                      {student.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 md:hidden">
                    <span className="text-[10px] font-bold text-primary/80">
                      {student.program.code}
                    </span>
                    <span className="text-center text-[10px] text-muted-foreground/40">
                      •
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/80">
                      {yearLevels
                        .find((level) => level.id === student.yearLevel)
                        ?.name.split(" ")[0] || "N/A"}{" "}
                      Year
                    </span>
                  </div>

                  <div className="hidden grid-cols-2 gap-2 md:grid">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground opacity-60">
                        Program
                      </span>
                      <span className="text-sm font-semibold text-primary/80">
                        {student.program.code}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground opacity-60">
                        Year Level
                      </span>
                      <span className="text-sm font-semibold text-foreground/80">
                        {yearLevels
                          .find((level) => level.id === student.yearLevel)
                          ?.name.split(" ")[0] || "N/A"}{" "}
                        Year
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 md:pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(event) => handleViewClick(student, event)}
                    className={cn(
                      "group/btn w-full justify-center gap-1 rounded-xl md:gap-2",
                      "border-primary/20 bg-primary/10 py-1.5 md:py-3",
                      "text-[9px] font-bold uppercase md:text-xs",
                      "whitespace-nowrap text-primary hover:bg-primary hover:text-white active:scale-[0.97]",
                    )}
                  >
                    <Eye
                      size={12}
                      className={cn(
                        "shrink-0 transition-transform",
                        "group-hover/btn:scale-110 md:size-[14px]",
                      )}
                    />
                    <span>
                      View <span className="hidden sm:inline">Profile</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-glass-border bg-glass-bg/20",
            "shadow-md backdrop-blur-glass",
          )}
        >
          <Table
            data={sortedVisibleStudents}
            columns={columns}
            renderMobileItem={renderMobileItem}
            isLoading={false}
            tableClassName="min-w-[72rem]"
            onRowClick={(student) => onViewClick(student)}
          />
        </div>
      )}
    </div>
  );
}