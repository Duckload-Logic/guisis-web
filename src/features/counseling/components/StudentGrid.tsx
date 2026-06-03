import { useState } from "react";
import { Eye, LayoutGrid, List } from "lucide-react";
import { Spinner } from "@/components/shared";
import { IIRProfileView } from "@/features/iir/types";
import { ProfileFemale, ProfileMale } from "@/assets/icons";
import { NothingFound } from "@/components/shared/NothingFound";
import { Table } from "@/components/shared/Table";
import { cn } from "@/lib/utils";

interface StudentGridProps {
  students: IIRProfileView[];
  isStudentsLoading: boolean;
  onViewClick: (student: IIRProfileView) => void;
  viewMode: "tile" | "list";
  yearLevels: { id: number; name: string }[];
}

export default function StudentGrid({
  students,
  isStudentsLoading,
  onViewClick,
  viewMode,
  yearLevels,
}: StudentGridProps) {
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

  const columns = [
    {
      header: "Student Name",
      render: (student: IIRProfileView) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center",
              "justify-center overflow-hidden rounded-full",
              "bg-glass-bg/50 border border-primary/20",
            )}
          >
            {student.gender?.id === 1 || student?.gender?.id !== 2 ? (
              <ProfileMale className="h-4/5 w-4/5 text-primary/80" />
            ) : (
              <ProfileFemale className="h-4/5 w-4/5 text-primary/80" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {student.firstName} {student.lastName} {student.suffixName || ""}
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
            "inline-block rounded-full border px-2.5 py-0.5",
            "text-[10px] font-bold uppercase",
            statusColors[student.status?.id] || "bg-gray-200",
          )}
        >
          {student.status?.name || "Unknown"}
        </span>
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
                "justify-center overflow-hidden rounded-full",
                "bg-glass-bg/50 border border-primary/20",
              )}
            >
              {student.gender?.id === 1 || student?.gender?.id !== 2 ? (
                <ProfileMale className="h-4/5 w-4/5 text-primary/80" />
              ) : (
                <ProfileFemale className="h-4/5 w-4/5 text-primary/80" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {student.firstName} {student.lastName}{" "}
                {student.suffixName || ""}
              </p>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {student.studentNumber}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
              statusColors[student.status?.id] || "bg-gray-200",
            )}
          >
            {student.status?.name || "Unknown"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <div>
            <p className="text-[9px] font-bold uppercase text-muted-foreground/60">
              Course & Year
            </p>
            <p className="font-semibold text-foreground/80">
              {student.course.code} - {yrName} Yr
            </p>
          </div>
          <button
            onClick={() => onViewClick(student)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border",
              "border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px]",
              "font-bold uppercase text-primary transition-all",
              "duration-300 hover:bg-primary hover:text-white",
            )}
          >
            <Eye size={12} />
            View
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {viewMode === "tile" ? (
        <div
          className={cn(
            "grid gap-4 md:gap-6",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {students.map((student) => (
            <div
              key={student.email}
              className={cn(
                "hover:bg-glass-bg/40 group relative overflow-hidden",
                "rounded-md border border-glass-border bg-glass-bg p-3 md:p-6",
                "shadow-md backdrop-blur-glass transition-all duration-500",
                "hover:-translate-y-1.5 hover:border-primary/30",
                "hover:shadow-2xl active:scale-[0.98]",
              )}
            >
              {/* Status Badge (Desktop Only) */}
              <div
                className={cn(
                  "absolute right-4 top-4 rounded-full border px-3 py-1",
                  "hidden text-[10px] font-bold uppercase md:block",
                  statusColors[student.status?.id] || "bg-gray-200",
                )}
              >
                {student.status?.name || "Unknown"}
              </div>

              {/* Subtle Gradient Accent */}
              <div
                className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-full",
                  "bg-primary/5 blur-3xl transition-colors duration-500",
                  "group-hover:bg-primary/10",
                )}
              />

              <div className="relative z-10 flex flex-col gap-2 md:gap-5">
                {/* Header with Avatar and Name */}
                <div className="flex flex-col items-center gap-2 text-center md:gap-4">
                  <div className="group/avatar relative">
                    {/* Avatar Glow */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full bg-primary/20 opacity-0",
                        "blur-2xl transition-all duration-700",
                        "group-hover/avatar:bg-primary/30 group-hover:opacity-100",
                      )}
                    />

                    <div
                      className={cn(
                        "bg-glass-bg/50 relative flex h-16 w-16",
                        "items-center justify-center md:h-28 md:w-28",
                        "overflow-hidden rounded-full border-[3px]",
                        "border-primary/20 shadow-xl md:border-[6px]",
                        "transition-transform duration-500",
                      )}
                    >
                      {student.gender?.id === 1 || student?.gender?.id !== 2 ? (
                        <ProfileMale className="h-4/5 w-4/5 text-primary/80" />
                      ) : (
                        <ProfileFemale className="h-4/5 w-4/5 text-primary/80" />
                      )}
                    </div>

                    {/* Gender Indicator Badge */}
                    <div
                      className={cn(
                        "absolute bottom-0 right-0 flex h-5 w-5",
                        "items-center justify-center md:h-8 md:w-8",
                        "rounded-full border border-white/20 bg-card",
                        "shadow-lg backdrop-blur-md transition-transform",
                        "duration-500 group-hover/avatar:translate-x-1",
                        "group-hover/avatar:translate-y-1",
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full md:h-3.5 md:w-3.5",
                          "shadow-sm",
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
                      {student.firstName} {student.lastName}{" "}
                      {student.suffixName}
                    </h3>
                    <p className="text-[8px] font-bold uppercase text-primary/60 md:text-[11px]">
                      {student.studentNumber}
                    </p>

                    {/* Status Badge on Mobile */}
                    <div className="flex justify-center pt-0.5 md:hidden">
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-0.5",
                          "text-[7px] font-bold uppercase",
                          statusColors[student.status?.id] || "bg-gray-200",
                        )}
                      >
                        {student.status?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div
                  className={cn(
                    "border-glass-border/30 border-t pt-2",
                    "flex flex-col gap-1.5 md:gap-3",
                  )}
                >
                  <div className="hidden flex-col gap-0.5 md:flex">
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase",
                        "text-muted-foreground opacity-60",
                      )}
                    >
                      Email Address
                    </span>
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        "text-foreground/80",
                      )}
                    >
                      {student.email}
                    </span>
                  </div>

                  {/* Mobile Course & Year */}
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

                  {/* Desktop Course & Year Grid */}
                  <div className="hidden grid-cols-2 gap-2 md:grid">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          "text-muted-foreground opacity-60",
                        )}
                      >
                        Course
                      </span>
                      <span className="text-sm font-semibold text-primary/80">
                        {student.course.code}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          "text-muted-foreground opacity-60",
                        )}
                      >
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

                {/* Actions */}
                <div className="pt-1.5 md:pt-2">
                  <button
                    onClick={() => onViewClick(student)}
                    className={cn(
                      "group/btn inline-flex w-full items-center",
                      "justify-center gap-1 rounded-xl border md:gap-2",
                      "border-primary/20 bg-primary/10 py-1.5 md:py-3",
                      "text-[9px] font-bold uppercase md:text-xs",
                      "text-primary transition-all duration-300",
                      "hover:bg-primary hover:text-white",
                      "whitespace-nowrap active:scale-[0.97]",
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
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "bg-glass-bg/20 rounded-2xl border border-glass-border",
            "overflow-hidden shadow-sm backdrop-blur-glass",
          )}
        >
          <Table
            data={students}
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
