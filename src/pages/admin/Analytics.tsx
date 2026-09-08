import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  useAnalyticsDashboard,
} from "@/features/analytics/hooks/useAnalyticsDashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  TrendingUp,
  Users,
  MapPin,
  School,
  GraduationCap,
  DollarSign,
  HeartHandshake,
  FileDown,
  Download,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell } from "recharts";
import { SelectField } from "@/components/ui/select-field";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrograms, useEnrollmentYears } from "@/features/iir/hooks";
import { cn } from "@/lib/utils";
import { usePageMetadata } from "@/context";
import {
  PDFPreview,
  DocumentProgressDialog,
} from "@/components/shared";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useQuery } from "@tanstack/react-query";
import {
  GetAcademicSettings,
} from "@/features/student-core/services/academicSettingsService";
import type { DemographicStat } from "@/features/analytics/types";

// --- CONSTANTS & CHART CONFIG ---
const GENDER_COLORS = {
  male: "#3b82f6",
  female: "#ec4899",
} as const;

const GENDER_CONFIG = {
  Male: {
    label: "Male",
    color: GENDER_COLORS.male,
  },
  Female: {
    label: "Female",
    color: GENDER_COLORS.female,
  },
} satisfies ChartConfig;

const MAX_DISPLAY_CITIES = 5;
const ALL_PROGRAMS_VALUE = "0";

export default function AnalyticsPage() {
  const currentCalendarYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    currentCalendarYear.toString(),
  );
  const [selectedProgram, setSelectedProgram] =
    useState<string>(ALL_PROGRAMS_VALUE);

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["counselor", "academicSettings"],
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data,
    loading,
    error,
    refresh,
    generatePreview,
    downloadFromPreview,
    clearPreview,
    pdfUrl,
    isDownloading,
    downloadProgress,
  } = useAnalyticsDashboard();

  const { data: programsData } = usePrograms();
  const programs = useMemo(() => {
    return [
      { value: ALL_PROGRAMS_VALUE, label: "All Programs" },
      ...(programsData || []).map((p: any) => ({
        value: p.id.toString(),
        label: p.code,
      })),
    ];
  }, [programsData]);

  const { data: enrollmentYears } = useEnrollmentYears();
  const [hasSetDefaultYear, setHasSetDefaultYear] = useState(false);

  useEffect(() => {
    if (settings?.currentYearStart && !hasSetDefaultYear) {
      const yearStr = settings.currentYearStart.toString();
      setSelectedYear(yearStr);
      setHasSetDefaultYear(true);
      refresh(settings.currentYearStart, parseInt(selectedProgram), 0);
    } else if (!settings && !isSettingsLoading && !hasSetDefaultYear) {
      const fallbackYear = new Date().getFullYear();
      setSelectedYear(fallbackYear.toString());
      setHasSetDefaultYear(true);
      refresh(fallbackYear, parseInt(selectedProgram), 0);
    }
  }, [
    settings,
    isSettingsLoading,
    hasSetDefaultYear,
    selectedProgram,
    refresh,
  ]);

  const handleYearChange = useCallback(
    (val: string) => {
      setSelectedYear(val);
      refresh(parseInt(val), parseInt(selectedProgram), 0);
    },
    [refresh, selectedProgram],
  );

  const handleProgramChange = useCallback(
    (val: string) => {
      setSelectedProgram(val);
      refresh(parseInt(selectedYear), parseInt(val), 0);
    },
    [refresh, selectedYear],
  );

  const yearOptions = useMemo(() => {
    const yearSet = new Set<number>();
    if (settings?.currentYearStart) {
      yearSet.add(settings.currentYearStart);
    }
    (enrollmentYears || []).forEach((year: number) => {
      if (Number.isFinite(year)) yearSet.add(year);
    });
    const parsedYear = Number.parseInt(selectedYear, 10);
    if (Number.isFinite(parsedYear) && parsedYear > 0) {
      yearSet.add(parsedYear);
    }
    if (yearSet.size === 0) {
      yearSet.add(currentCalendarYear);
    }
    return Array.from(yearSet)
      .sort((a, b) => b - a)
      .map((year: number) => ({
        value: year.toString(),
        label: year.toString(),
      }));
  }, [currentCalendarYear, enrollmentYears, selectedYear, settings]);

  const selectedProgramLabel = useMemo(() => {
    return (
      programs.find((p) => p.value === selectedProgram)?.label ||
      "Selected Program"
    );
  }, [programs, selectedProgram]);

  const headerActions = useMemo(
    () => (
      <div
        className={cn(
          "flex w-full flex-col gap-3",
          "sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end",
        )}
      >
        <div className="w-full min-w-[8.5rem] sm:w-36">
          <SelectField
            name="year"
            get="value"
            identifier="value"
            value={selectedYear}
            onChange={handleYearChange}
            options={yearOptions}
            formStyle={false}
          />
        </div>

        <div className="w-full min-w-[11rem] sm:w-44 md:w-52">
          <SelectField
            name="program"
            get="value"
            identifier="value"
            value={selectedProgram}
            onChange={handleProgramChange}
            options={programs}
            formStyle={false}
          />
        </div>

        <Button
          variant="outline"
          disabled={isDownloading || !data || data.totalStudents === 0}
          onClick={() =>
            generatePreview(
              parseInt(selectedYear),
              parseInt(selectedProgram),
            )
          }
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl",
            "border-glass-border/40 border bg-muted/20 px-4 py-2.5",
            "text-left text-sm font-medium tracking-tight text-foreground",
            "shadow-sm outline-none transition-all duration-200",
            "hover:border-glass-border/60 focus:border-primary/50",
            "focus:bg-glass-bg focus:ring-2 focus:ring-primary/5",
            "sm:w-auto sm:min-w-[12.5rem]",
          )}
        >
          <FileDown className="h-4 w-4 shrink-0" />
          <span className="truncate">Download Report</span>
        </Button>
      </div>
    ),
    [
      selectedYear,
      handleYearChange,
      yearOptions,
      selectedProgram,
      handleProgramChange,
      programs,
      isDownloading,
      generatePreview,
      data,
    ],
  );

  const pageBadgeIcon = useMemo(() => <TrendingUp className="h-4 w-4" />, []);

  usePageMetadata({
    title: "Student Analytics",
    description:
      "Holistic analysis of student demographics, academic background, " +
      "and socioeconomic profiles",
    badgeText: "Real-time Metrics",
    badgeIcon: pageBadgeIcon,
    isLoading: false,
    headerActions,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/10 text-destructive"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="ml-2 font-medium">
            Could not retrieve analytics data: {error}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() =>
            refresh(parseInt(selectedYear), parseInt(selectedProgram), 0)
          }
          className="mt-4 border-primary/20 hover:bg-primary/5"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (loading && !data) {
    return <AnalyticsBentoSkeleton />;
  }

  const hasNoData = !data || data.totalStudents === 0;

  return (
    <>
      <DocumentProgressDialog
        open={isDownloading}
        progress={downloadProgress}
        message="Please wait while we compile your report."
      />

      <div
        className={cn(
          "mx-auto flex w-full flex-col space-y-6",
          "px-4 sm:px-6 md:px-8 pb-12",
        )}
      >
        {hasNoData ? (
          <EmptyAnalyticsState
            selectedYear={selectedYear}
            selectedProgram={selectedProgram}
            selectedProgramLabel={selectedProgramLabel}
            onResetFilter={() => handleProgramChange(ALL_PROGRAMS_VALUE)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Bento 1: Cohort Overview & Gender Distribution (8 cols) */}
            <div
              className="animate-fade-in-up col-span-12 lg:col-span-8"
              style={{ animationDelay: "0.04s", animationFillMode: "both" }}
            >
              <CohortOverviewCard data={data} />
            </div>

            {/* Bento 2: Cohort Dominant Highlights (4 cols) */}
            <div
              className="animate-fade-in-up col-span-12 lg:col-span-4"
              style={{ animationDelay: "0.08s", animationFillMode: "both" }}
            >
              <CohortVitalsCard data={data} />
            </div>

            {/* Bento 3: Academic Readiness / High School GWA (7 cols) */}
            <div
              className="animate-fade-in-up col-span-12 lg:col-span-7"
              style={{ animationDelay: "0.12s", animationFillMode: "both" }}
            >
              <BentoCard
                title="Academic Readiness"
                description={
                  "High School General Weighted Average (GWA) brackets"
                }
                icon={<GraduationCap className="h-4 w-4 text-primary" />}
              >
                <DistributionBarList
                  items={data.highSchoolGWA}
                  totalCohort={data.totalStudents}
                  emptyMessage="No high school GWA records reported"
                  accentColorClass="bg-primary"
                />
              </BentoCard>
            </div>

            {/* Bento 4: Geographic Reach / Top Municipalities (5 cols) */}
            <div
              className="animate-fade-in-up col-span-12 lg:col-span-5"
              style={{ animationDelay: "0.16s", animationFillMode: "both" }}
            >
              <BentoCard
                title="Geographic Distribution"
                description="Top municipalities and student residences"
                icon={<MapPin className="h-4 w-4 text-emerald-500" />}
              >
                <DistributionBarList
                  items={[...(data.cityAddress || [])]
                    .sort((a, b) => (b.total || 0) - (a.total || 0))
                    .slice(0, MAX_DISPLAY_CITIES)}
                  totalCohort={data.totalStudents}
                  emptyMessage="No residence locations recorded"
                  accentColorClass="bg-emerald-500"
                />
                {(data.cityAddress || []).length > MAX_DISPLAY_CITIES && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    + {
                      (data.cityAddress || []).length -
                      MAX_DISPLAY_CITIES
                    }{" "}
                    more locations in full report
                  </p>
                )}
              </BentoCard>
            </div>

            {/* Bento 5: Socioeconomic Bracket (6 cols) */}
            <div
              className="animate-fade-in-up col-span-12 md:col-span-6"
              style={{ animationDelay: "0.20s", animationFillMode: "both" }}
            >
              <BentoCard
                title="Monthly Family Income"
                description="Socioeconomic brackets for financial guidance"
                icon={<DollarSign className="h-4 w-4 text-amber-500" />}
              >
                <DistributionBarList
                  items={data.monthlyIncome}
                  totalCohort={data.totalStudents}
                  emptyMessage="No income data recorded"
                  accentColorClass="bg-amber-500"
                />
              </BentoCard>
            </div>

            {/* Bento 6: Family Structure & Living Environment (6 cols) */}
            <div
              className="animate-fade-in-up col-span-12 md:col-span-6"
              style={{ animationDelay: "0.24s", animationFillMode: "both" }}
            >
              <BentoCard
                title="Family Birth Order"
                description="Ordinal position of students among siblings"
                icon={<HeartHandshake className="h-4 w-4 text-indigo-500" />}
              >
                <DistributionBarList
                  items={data.ordinalPosition}
                  totalCohort={data.totalStudents}
                  emptyMessage="No sibling order data recorded"
                  accentColorClass="bg-indigo-500"
                />
              </BentoCard>
            </div>
          </div>
        )}

        <ResponsiveModal
          open={!!pdfUrl}
          onOpenChange={(open) => !open && clearPreview()}
        >
          <ResponsiveModalContent
            hasCloseButton={false}
            className="flex h-[90vh] max-h-[90vh] flex-col p-0 sm:max-w-4xl"
          >
            <ResponsiveModalHeader className="h-14 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <ResponsiveModalTitle>
                  Student Profiles PDF Preview
                </ResponsiveModalTitle>
                <button
                  onClick={downloadFromPreview}
                  className={cn(
                    "flex items-center gap-2 rounded-lg bg-emerald-500",
                    "px-4 py-2 text-sm font-semibold text-white",
                    "transition-colors hover:bg-emerald-600",
                  )}
                >
                  <Download size={16} />
                  <p className="hidden sm:block">Download PDF</p>
                </button>
              </div>
            </ResponsiveModalHeader>
            <div className="flex-1 overflow-hidden bg-muted/20">
              {pdfUrl && (
                <PDFPreview
                  url={pdfUrl}
                  className="h-full w-full rounded-b-lg border-0"
                  title="PDF Preview"
                />
              )}
            </div>
          </ResponsiveModalContent>
        </ResponsiveModal>
      </div>
    </>
  );
}

// --- BENTO COMPONENTS ---

interface BentoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const BentoCard = React.memo(
  ({ title, description, icon, children, className }: BentoCardProps) => {
    return (
      <Card
        className={cn(
          "group relative flex h-full flex-col overflow-hidden",
          "border border-border/60 bg-card/60 backdrop-blur-sm",
          "transition-all duration-300 hover:-translate-y-0.5",
          "hover:border-border hover:shadow-md",
          className,
        )}
      >
        <CardHeader
          className={cn(
            "flex flex-row items-start justify-between",
            "border-b border-border/40 bg-muted/10 p-4 pb-3",
          )}
        >
          <div className="space-y-0.5">
            <CardTitle
              className="text-sm font-bold tracking-tight text-foreground"
            >
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          {icon && (
            <div
              className={cn(
                "rounded-xl border border-border/40",
                "bg-background/80 p-2 shadow-xs",
              )}
            >
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-5">{children}</CardContent>
      </Card>
    );
  },
);

const CohortOverviewCard = React.memo(({ data }: { data: any }) => {
  const maleStat = useMemo(() => {
    return (data?.genderDistribution || []).find(
      (g: DemographicStat) => g.category.toLowerCase() === "male",
    );
  }, [data]);

  const femaleStat = useMemo(() => {
    return (data?.genderDistribution || []).find(
      (g: DemographicStat) => g.category.toLowerCase() === "female",
    );
  }, [data]);

  const malePct = maleStat?.totalPct ?? 0;
  const femalePct = femaleStat?.totalPct ?? 0;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden",
        "border border-border/60 bg-card/60 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between",
          "border-b border-border/40 bg-muted/10 p-5 pb-4",
        )}
      >
        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            Cohort Demographics
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Total student intake and gender distribution
          </CardDescription>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border",
            "border-primary/20 bg-primary/10 px-3 py-1",
            "text-xs font-semibold text-primary",
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Active Cohort</span>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-1 flex-col justify-between gap-6 p-5",
          "sm:flex-row sm:items-center",
        )}
      >
        {/* Left Stats Section */}
        <div className="flex-1 space-y-5">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase",
                "tracking-wider text-muted-foreground",
              )}
            >
              Total Enrolled Students
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-4xl font-extrabold tracking-tight",
                  "text-foreground",
                )}
              >
                {(data?.totalStudents || 0).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Analyzed Profiles
              </span>
            </div>
          </div>

          {/* Segmented Ratio Bar */}
          <div className="space-y-2">
            <div
              className={cn(
                "flex items-center justify-between",
                "text-xs font-semibold",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  "text-blue-600 dark:text-blue-400",
                )}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Male: {maleStat?.total?.toLocaleString() ?? 0} ({malePct}%)
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  "text-pink-600 dark:text-pink-400",
                )}
              >
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Female: {femaleStat?.total?.toLocaleString() ?? 0} (
                {femalePct}%)
              </span>
            </div>

            <div
              className={cn(
                "flex h-3.5 w-full overflow-hidden rounded-full",
                "bg-muted/50 p-0.5",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-l-full bg-blue-500",
                  "transition-all duration-500",
                )}
                style={{ width: `${Math.max(malePct, 0)}%` }}
              />
              <div
                className={cn(
                  "h-full rounded-r-full bg-pink-500",
                  "transition-all duration-500",
                )}
                style={{ width: `${Math.max(femalePct, 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Donut Chart */}
        <div className="flex shrink-0 items-center justify-center">
          <ChartContainer
            config={GENDER_CONFIG}
            className={cn(
              "aspect-square h-[140px] w-[140px]",
              "sm:h-[160px] sm:w-[160px]",
            )}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data?.genderDistribution ?? []}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={4}
                dataKey="total"
                nameKey="category"
                isAnimationActive={false}
              >
                {(data?.genderDistribution ?? []).map(
                  (gender: DemographicStat) => (
                    <Cell
                      key={gender.category}
                      fill={
                        gender.category.toLowerCase() === "male"
                          ? GENDER_COLORS.male
                          : GENDER_COLORS.female
                      }
                    />
                  ),
                )}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
});

function getTopDemographic(
  items?: DemographicStat[],
): DemographicStat | null {
  if (!items || items.length === 0) return null;
  return items.reduce((max, curr) =>
    (curr.total || 0) > (max.total || 0) ? curr : max,
  );
}

const CohortVitalsCard = React.memo(({ data }: { data: any }) => {
  const topLocation = useMemo(
    () => getTopDemographic(data?.cityAddress),
    [data?.cityAddress],
  );
  const topNature = useMemo(
    () => getTopDemographic(data?.natureOfSchooling),
    [data?.natureOfSchooling],
  );
  const topOrdinal = useMemo(
    () => getTopDemographic(data?.ordinalPosition),
    [data?.ordinalPosition],
  );

  return (
    <Card
      className={cn(
        "flex h-full flex-col justify-between overflow-hidden",
        "border border-border/60 bg-card/60 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <CardHeader className="border-b border-border/40 bg-muted/10 p-4 pb-3">
        <CardTitle className="text-sm font-bold tracking-tight">
          Dominant Highlights
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Primary cohort demographics at a glance
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-around gap-3 p-4">
        <VitalTile
          icon={<MapPin className="h-4 w-4 text-emerald-500" />}
          label="Primary Residence"
          value={topLocation?.category || "None"}
          share={`${topLocation?.totalPct || 0}%`}
        />
        <VitalTile
          icon={<School className="h-4 w-4 text-primary" />}
          label="School Background"
          value={topNature?.category || "None"}
          share={`${topNature?.totalPct || 0}%`}
        />
        <VitalTile
          icon={<Users className="h-4 w-4 text-indigo-500" />}
          label="Family Position"
          value={topOrdinal?.category || "None"}
          share={`${topOrdinal?.totalPct || 0}%`}
        />
      </CardContent>
    </Card>
  );
});

function VitalTile({
  icon,
  label,
  value,
  share,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  share: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border border-border/50",
        "bg-background/60 p-3 transition-colors hover:bg-background/90",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className={cn(
            "rounded-lg border border-border/40",
            "bg-muted/30 p-2 shrink-0",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              "text-muted-foreground truncate",
            )}
          >
            {label}
          </p>
          <p className="truncate text-xs font-semibold text-foreground">
            {value}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-md bg-muted/60 px-2 py-0.5",
          "text-[11px] font-bold text-foreground",
        )}
      >
        {share}
      </span>
    </div>
  );
}

interface DistributionBarListProps {
  items?: DemographicStat[];
  totalCohort: number;
  emptyMessage: string;
  accentColorClass?: string;
}

const DistributionBarList = React.memo(
  ({
    items,
    emptyMessage,
    accentColorClass = "bg-primary",
  }: DistributionBarListProps) => {
    if (!items || items.length === 0) {
      return (
        <div
          className={cn(
            "flex h-32 items-center justify-center",
            "text-xs text-muted-foreground",
          )}
        >
          {emptyMessage}
        </div>
      );
    }

    const maxPercentage = Math.max(
      ...items.map((item) => item.totalPct || 0),
      1,
    );

    return (
      <div className="space-y-3.5">
        {items.map((item) => {
          const barWidth = `${Math.min(
            100,
            Math.round(((item.totalPct || 0) / maxPercentage) * 100),
          )}%`;

          return (
            <div key={item.category} className="space-y-1">
              <div
                className={cn(
                  "flex items-center justify-between",
                  "text-xs font-medium",
                )}
              >
                <span className="truncate text-foreground pr-2 font-semibold">
                  {item.category}
                </span>
                <span className="shrink-0 text-muted-foreground text-[11px]">
                  <strong className="text-foreground font-semibold">
                    {item.total.toLocaleString()}
                  </strong>{" "}
                  ({item.totalPct}%)
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted/40"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    accentColorClass,
                  )}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

function EmptyAnalyticsState({
  selectedYear,
  selectedProgram,
  selectedProgramLabel,
  onResetFilter,
}: {
  selectedYear: string;
  selectedProgram: string;
  selectedProgramLabel: string;
  onResetFilter: () => void;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in-up flex flex-col items-center justify-center",
        "rounded-3xl border border-dashed border-border/80 bg-card/40 p-12",
        "text-center shadow-xs backdrop-blur-sm",
      )}
      style={{ animationDuration: "350ms" }}
    >
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
          "border border-border/50 bg-muted/40",
          "text-muted-foreground shadow-inner",
        )}
      >
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">
        No Student Profiles Found
      </h3>
      <p
        className={cn(
          "mt-1.5 max-w-md text-sm leading-relaxed",
          "text-muted-foreground",
        )}
      >
        No Individual Inventory Records (IIR) were submitted for Academic
        Year{" "}
        <span className="font-semibold text-foreground">{selectedYear}</span>
        {selectedProgram !== ALL_PROGRAMS_VALUE
          ? ` under ${selectedProgramLabel}`
          : ""}
        . Try picking another academic year or changing the program filter.
      </p>
      {selectedProgram !== ALL_PROGRAMS_VALUE && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilter}
          className="mt-6 gap-2 rounded-xl text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to All Programs
        </Button>
      )}
    </div>
  );
}

function AnalyticsBentoSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Skeleton className="col-span-12 h-64 rounded-3xl lg:col-span-8" />
        <Skeleton className="col-span-12 h-64 rounded-3xl lg:col-span-4" />
        <Skeleton className="col-span-12 h-80 rounded-3xl lg:col-span-7" />
        <Skeleton className="col-span-12 h-80 rounded-3xl lg:col-span-5" />
        <Skeleton className="col-span-12 h-72 rounded-3xl md:col-span-6" />
        <Skeleton className="col-span-12 h-72 rounded-3xl md:col-span-6" />
      </div>
    </div>
  );
}
