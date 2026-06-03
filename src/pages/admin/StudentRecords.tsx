import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentFilters from "@/features/counseling/components/StudentFilters";
import StudentGrid from "@/features/counseling/components/StudentGrid";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LayoutGrid, List, Users } from "lucide-react";
import {
  useCourses,
  useGenders,
  useIIRPagination,
  useStudentStatuses,
} from "@/features/iir/hooks";
import { IIRProfileView } from "@/features/iir/types";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/shared";
import { Pagination } from "@/components/shared";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function StudentRecordsSkeleton() {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6",
        "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      )}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "group relative overflow-hidden rounded-[28px]",
            "border border-glass-border bg-glass-bg p-6",
            "shadow-sm backdrop-blur-glass",
          )}
        >
          {/* Status Badge Skeleton */}
          <div className="absolute right-4 top-4">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col gap-5">
            {/* Header with Avatar and Name */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Skeleton
                  className={cn(
                    "h-28 w-28 rounded-full border-[6px]",
                    "border-primary/20",
                  )}
                />
                <div className="absolute bottom-1 right-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>

              <div className="flex w-full flex-col items-center space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>

            {/* Info Grid Skeleton */}
            <div
              className={cn(
                "border-glass-border/30 grid grid-cols-1 gap-3",
                "border-t pt-4",
              )}
            >
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-1/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentRecords() {
  const {
    data: courses,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useCourses();
  const {
    data: genders,
    isLoading: isGendersLoading,
    isError: isGendersError,
  } = useGenders();
  const {
    data: statuses,
    isLoading: isStatusesLoading,
    isError: isStatusesError,
  } = useStudentStatuses();
  const yearLevels = [
    { id: 1, name: "1st Year" },
    { id: 2, name: "2nd Year" },
    { id: 3, name: "3rd Year" },
    { id: 4, name: "4th Year" },
  ];

  const [viewMode, setViewMode] = useState<"tile" | "list">(() => {
    const saved = localStorage.getItem("student_grid_view_mode");
    return saved === "tile" ? "tile" : "list";
  });

  const handleViewModeChange = (mode: "tile" | "list") => {
    setViewMode(mode);
    localStorage.setItem("student_grid_view_mode", mode);
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedCourseId, setSelectedCourseId] = useState(0);
  const [selectedGenderId, setSelectedGenderId] = useState(0);
  const [selectedYearLevelId, setSelectedYearLevelId] = useState(0);
  const [selectedStatusId, setSelectedStatusId] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
    error: studentsError,
  } = useIIRPagination({
    page,
    pageSize,
    search: debouncedSearch,
    courseId: selectedCourseId,
    genderId: selectedGenderId,
    yearLevel: selectedYearLevelId,
    statusId: selectedStatusId,
  });

  const allStudents = data?.students || [];

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<IIRProfileView | null>(
    null,
  );
  const navigate = useNavigate();

  const isGridLoading =
    isCoursesLoading || isGendersLoading || isStudentsLoading;

  usePageMetadata(
    useMemo(
      () => ({
        title: "Student Records",
        description:
          "Access and manage student cumulative records and personal " +
          "information",
        headerActions: (
          <div
            className={cn(
              "flex items-center gap-1 rounded-xl border border-glass-border p-1 shadow-md",
              "bg-glass-bg/50 backdrop-blur-glass",
            )}
          >
            <button
              onClick={() => handleViewModeChange("list")}
              className={cn(
                "flex items-center justify-center",
                "rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:bg-glass-bg " +
                      "hover:text-foreground",
              )}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => handleViewModeChange("tile")}
              className={cn(
                "flex items-center justify-center",
                "rounded-lg transition-all",
                viewMode === "tile"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:bg-glass-bg " +
                      "hover:text-foreground",
              )}
              title="Tile View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        ),
        badgeText: "Admin Management",
        badgeIcon: <Users className="h-4 w-4" />,
        isLoading: false,
      }),
      [viewMode],
    ),
  );

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            if (value === searchTerm) return;
            setSearchTerm(value);
            setPage(1);
          }}
          courses={courses}
          selectedCourseId={selectedCourseId}
          onCourseChange={(id: number) => {
            if (id === selectedCourseId) return;
            setSelectedCourseId(id);
            setPage(1);
          }}
          genders={genders}
          selectedGenderId={selectedGenderId}
          onGenderChange={(id: number) => {
            if (id === selectedGenderId) return;
            setSelectedGenderId(id);
            setPage(1);
          }}
          yearLevels={yearLevels}
          selectedYearLevelId={selectedYearLevelId}
          onYearLevelChange={(level: number) => {
            if (level === selectedYearLevelId) return;
            setSelectedYearLevelId(level);
            setPage(1);
          }}
          statuses={statuses}
          selectedStatusId={selectedStatusId}
          onStatusChange={(id: number) => {
            if (id === selectedStatusId) return;
            setSelectedStatusId(id);
            setPage(1);
          }}
        />

        <div className="relative min-h-[400px]">
          {isGridLoading ? (
            <StudentRecordsSkeleton />
          ) : (
            <div className="space-y-8 transition-all duration-700">
              <StudentGrid
                students={allStudents}
                isStudentsLoading={false} // Loading handled by parent
                onViewClick={(student: any) => {
                  navigate(`/admin/student-records/${student.iirId}`, {
                    state: { student },
                  });
                }}
                viewMode={viewMode}
                yearLevels={yearLevels}
              />

              <Pagination
                currentPage={page}
                totalPages={data?.meta?.totalPages || 1}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
