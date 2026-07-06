import { useMemo, useRef, useState, type MouseEvent } from "react";
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
import { IIRProfileView } from "@/features/iir/types";
import { ProfileFemale, ProfileMale } from "@/assets/icons";
import { NothingFound } from "@/components/shared/NothingFound";
import { Table } from "@/components/shared/Table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/form";
import { Input } from "@/components/ui/input";
import { getIIRTwoByTwoPhoto } from "@/features/iir/utils/twoByTwoPhoto";

interface StudentGridProps {
  students: IIRProfileView[];
  isStudentsLoading: boolean;
  onViewClick: (student: IIRProfileView) => void;
  viewMode: "tile" | "list";
  onViewModeChange: (mode: "tile" | "list") => void;
  yearLevels: { id: number; name: string }[];
}

type StudentSortOrder = "asc" | "desc";
type StudentSortKey = "studentName" | "studentNumber" | "course" | "email";


function getStudentName(student: IIRProfileView) {
  return `${student.firstName || ""} ${student.lastName || ""} ${student.suffixName || ""}`
    .replace(/\s+/g, " ")
    .trim();
}


function getStudentTwoByTwoPhoto(student: IIRProfileView) {
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
  isStudentsLoading,
  onViewClick,
  viewMode,
  onViewModeChange,
  yearLevels,
}: StudentGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [selectedSort, setSelectedSort] =
    useState<StudentSortKey>("studentName");
  const [selectedOrder, setSelectedOrder] =
    useState<StudentSortOrder>("asc");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSortingByStudentName = selectedSort === "studentName";
  const nextStudentSortOrder: StudentSortOrder =
    isSortingByStudentName && selectedOrder === "asc" ? "desc" : "asc";
  const SortArrow = nextStudentSortOrder === "asc" ? ArrowUp : ArrowDown;

  const statusOptions = useMemo(() => {
    const statusMap = new Map<string, { id: string; name: string; count: number }>();

    students.forEach((student) => {
      const id = String(student.status?.id || "unknown");
      const name = student.status?.name || "Unknown";
      const existing = statusMap.get(id);

      statusMap.set(id, {
        id,
        name,
        count: existing ? existing.count + 1 : 1,
      });
    });

    return [
      { id: "all", name: "All Statuses", count: students.length },
      ...Array.from(statusMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    ].map((status) => ({
      ...status,
      displayName:
        status.id === "all"
          ? status.name
          : `${status.name} (${status.count})`,
    }));
  }, [students]);

  const sortOptions = useMemo(
    () => [
      { id: "studentName", name: "Student Name" },
      { id: "studentNumber", name: "Student Number" },
      { id: "course", name: "Course" },
      { id: "email", name: "Email Address" },
    ],
    [],
  );

  const orderOptions = useMemo(
    () => [
      { id: "asc", name: "Ascending" },
      { id: "desc", name: "Descending" },
    ],
    [],
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus =
        selectedStatusId === "all" ||
        String(student.status?.id || "unknown") === selectedStatusId;

      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      return [
        getStudentName(student),
        student.studentNumber,
        student.email,
        student.course?.code,
        student.status?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [searchTerm, selectedStatusId, students]);

  const sortedVisibleStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const getSortValue = (student: IIRProfileView) => {
        if (selectedSort === "studentNumber") return student.studentNumber || "";
        if (selectedSort === "course") return student.course?.code || "";
        if (selectedSort === "email") return student.email || "";
        return getStudentName(student);
      };

      const left = getSortValue(a).toLowerCase();
      const right = getSortValue(b).toLowerCase();
      const result = left.localeCompare(right);
      return selectedOrder === "asc" ? result : -result;
    });
  }, [filteredStudents, selectedOrder, selectedSort]);

  if (isStudentsLoading || !students) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (students.length === 0) {
    return <NothingFound message="No students found." />;
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

  const handleStudentNameSort = () => {
    setSelectedSort("studentName");
    setSelectedOrder(nextStudentSortOrder);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    handleSearchChange("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const handleStatusFilterChange = (statusId: string) => {
    setSelectedStatusId(statusId);
  };

  const handleSortChange = (value: unknown) => {
    const nextValue = String(value ?? "").trim();
    if (!["studentName", "studentNumber", "course", "email"].includes(nextValue)) {
      return;
    }
    setSelectedSort(nextValue as StudentSortKey);
  };

  const handleOrderChange = (value: unknown) => {
    if (value !== "asc" && value !== "desc") return;
    setSelectedOrder(value);
  };

  const handleViewClick = (
    student: IIRProfileView,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    onViewClick(student);
  };

  const columns = [
    {
      header: (
        <button
          type="button"
          onClick={handleStudentNameSort}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-2 py-1",
            "text-[11px] font-bold uppercase tracking-[0.14em]",
            "transition hover:bg-muted/70 hover:text-foreground",
            isSortingByStudentName ? "text-primary" : "text-muted-foreground",
          )}
          title={`Sort student name ${nextStudentSortOrder === "asc" ? "ascending" : "descending"}`}
        >
          Student Name
          <SortArrow className="h-3.5 w-3.5" />
        </button>
      ),
      render: (student: IIRProfileView) => (
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
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {getStudentName(student) || "Unnamed Student"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Student Number",
      render: (student: IIRProfileView) => (
        <span className="text-xs font-bold uppercase text-primary/60">
          {student.studentNumber}
        </span>
      ),
    },
    {
      header: "Email Address",
      render: (student: IIRProfileView) => (
        <span className="text-sm font-medium text-foreground/80">
          {student.email}
        </span>
      ),
    },
    {
      header: "Course & Year",
      render: (student: IIRProfileView) => {
        const yrName =
          yearLevels
            .find((level) => level.id === student.yearLevel)
            ?.name.split(" ")[0] || "N/A";
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary/80">
              {student.course.code}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {yrName} Year
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      render: (student: IIRProfileView) => (
        <span
          className={cn(
            "inline-block rounded-xl border px-2.5 py-0.5",
            "text-[10px] font-bold uppercase shadow-md",
            statusColors[student.status?.id] || "bg-gray-200",
          )}
        >
          {student.status?.name || "Unknown"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (student: IIRProfileView) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => handleViewClick(student, event)}
            className="h-8 rounded-xl border-primary/20 bg-primary/5 px-3 text-[11px] font-semibold text-primary"
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        </div>
      ),
    },
  ];

  const renderMobileItem = (student: IIRProfileView) => {
    const yrName =
      yearLevels
        .find((level) => level.id === student.yearLevel)
        ?.name.split(" ")[0] || "N/A";

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
              Course & Year
            </p>
            <p className="font-semibold text-foreground/80">
              {student.course.code} - {yrName} Yr
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

  if (sortedVisibleStudents.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-glass-border bg-glass-bg p-8 text-center shadow-md backdrop-blur-glass">
        <NothingFound
          message="No students match the current filters."
        />
        <div className="flex flex-wrap justify-center gap-2">
          {selectedStatusId !== "all" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatusFilterChange("all")}
              className="rounded-xl shadow-md"
            >
              Show all statuses
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="space-y-3 rounded-xl border border-glass-border bg-glass-bg/50 px-4 py-3 shadow-md backdrop-blur-glass">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Click Student Name to sort directly. Use the search, status, sort by, and order controls to refine the list.
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border border-border/60 bg-background/70 p-3 shadow-md",
            "backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]",
          )}
        >
          <div
            className={cn(
              "grid w-full min-w-0 grid-cols-1 items-end gap-3",
              "md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_210px_170px]",
            )}
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Search
              </label>
              <div
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl border border-border/70",
                  "bg-muted/50 px-3 shadow-md transition-all duration-200",
                  "focus-within:border-border focus-within:bg-background focus-within:ring-2 focus-within:ring-muted/70",
                  "dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]",
                )}
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by name, email, or student number..."
                  spellCheck={false}
                  autoComplete="off"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={handleClearSearch}
                    className={cn(
                      "h-7 min-h-7 w-7 shrink-0 rounded-xl shadow-none",
                      "text-muted-foreground hover:bg-background hover:text-foreground",
                    )}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <Dropdown
                label="Status"
                options={statusOptions}
                value={selectedStatusId}
                onChange={(value) => handleStatusFilterChange(String(value))}
                labelKey="displayName"
                enabled={!isStudentsLoading}
                formStyle={false}
              />
            </div>

            <div className="min-w-0">
              <Dropdown
                label="Sort By"
                options={sortOptions}
                value={selectedSort}
                onChange={handleSortChange}
                enabled={!isStudentsLoading}
                formStyle={false}
              />
            </div>

            <div className="min-w-0">
              <Dropdown
                label="Order"
                options={orderOptions}
                value={selectedOrder}
                onChange={handleOrderChange}
                enabled={!isStudentsLoading}
                formStyle={false}
              />
            </div>
          </div>
        </div>
      </div>

      {viewMode === "tile" ? (
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
                "group relative overflow-hidden hover:bg-glass-bg/40",
                "rounded-xl border border-glass-border bg-glass-bg p-3 md:p-6",
                "shadow-md backdrop-blur-glass transition-all duration-500",
                "hover:-translate-y-1.5 hover:border-primary/30",
                "hover:shadow-md active:scale-[0.98]",
              )}
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
                        "line-clamp-1 text-xs font-bold md:text-xl",
                        "tracking-tight text-foreground transition-colors",
                        "group-hover:text-primary",
                      )}
                    >
                      {getStudentName(student) || "Unnamed Student"}
                    </h3>
                    <p className="text-[8px] font-bold uppercase text-primary/60 md:text-[11px]">
                      {student.studentNumber}
                    </p>

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
                    "border-glass-border/30 border-t pt-2",
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
                      {student.course.code}
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
                        Course
                      </span>
                      <span className="text-sm font-semibold text-primary/80">
                        {student.course.code}
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
            onRowClick={(student) => onViewClick(student)}
          />
        </div>
      )}
    </div>
  );
}
