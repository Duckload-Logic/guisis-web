import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared";
import StudentGrid from "@/features/counseling/components/StudentGrid";
import { useIIRPagination } from "@/features/iir/hooks";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

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
            "group relative overflow-hidden rounded-xl",
            "border border-glass-border bg-glass-bg p-6",
            "shadow-md backdrop-blur-glass",
          )}
        >
          <div className="absolute right-4 top-4">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Skeleton
                  className={cn(
                    "h-28 w-28 rounded-xl border-[6px]",
                    "border-primary/20",
                  )}
                />
                <div className="absolute bottom-1 right-1">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>

              <div className="flex w-full flex-col items-center space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-3 border-t",
                "border-glass-border/30 pt-4",
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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"tile" | "list">(() => {
    const saved = localStorage.getItem("student_grid_view_mode");
    return saved === "tile" ? "tile" : "list";
  });
  const [page, setPage] = useState(1);

  const pageSize = 12;
  const yearLevels = [
    { id: 1, name: "1st Year" },
    { id: 2, name: "2nd Year" },
    { id: 3, name: "3rd Year" },
    { id: 4, name: "4th Year" },
  ];

  const handleViewModeChange = (mode: "tile" | "list") => {
    setViewMode(mode);
    localStorage.setItem("student_grid_view_mode", mode);
  };

  const {
    data,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
    error: studentsError,
  } = useIIRPagination({
    page,
    pageSize,
  });

  const allStudents = data?.students || [];

  usePageMetadata({
    title: "Student Records",
    description:
      "Access and manage student cumulative records and personal information",
    badgeText: "Admin Management",
    badgeIcon: <Users className="h-4 w-4" />,
    isLoading: false,
  });

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col space-y-8 pb-12",
        "px-4 sm:px-6 md:px-8",
      )}
    >
      {isStudentsError && (
        <Alert variant="destructive" className="rounded-xl shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(studentsError as Error)?.message ||
              "Unable to load student records."}
          </AlertDescription>
        </Alert>
      )}

      <div
        className="animate-fade-in-up relative min-h-[400px]"
        style={{ animationDelay: "0.05s", animationFillMode: "both" }}
      >
        {isStudentsLoading ? (
          <StudentRecordsSkeleton />
        ) : (
          <div
            className="animate-fade-in-up space-y-8"
            style={{ animationDelay: "0.10s", animationFillMode: "both" }}
          >
            <StudentGrid
              students={allStudents}
              isStudentsLoading={false}
              onViewClick={(student) => {
                navigate(`/admin/student-records/${student.iirId}`, {
                  state: { student },
                });
              }}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
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
  );
}
