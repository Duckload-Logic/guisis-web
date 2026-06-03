import React, { useState, useMemo, useEffect } from "react";
import { useAnalyticsDashboard } from "@/features/analytics/hooks/useAnalyticsDashboard";
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
  Home,
  Network,
  FileDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Dropdown } from "@/components/form";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses, useEnrollmentYears } from "@/features/iir/hooks";
import { cn } from "@/lib/utils";
import { usePageMetadata } from "@/context";
import { FullScreenLoader } from "@/components/shared";
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

// --- THEME COLORS ---
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "#3b82f6", // male
  "#ec4899", // female
  "#94a3b8", // total/muted
  "#10b981", // emerald
];

// --- CHART CONFIGURATIONS ---
const genderSplitConfig = {
  maleCount: {
    label: "Male",
    color: "#3b82f6",
  },
  femaleCount: {
    label: "Female",
    color: "#ec4899",
  },
  total: {
    label: "Total Students",
    color: "#94a3b8",
  },
} satisfies ChartConfig;

const genderDistributionConfig = {
  Male: {
    label: "Male",
    color: "#3b82f6",
  },
  Female: {
    label: "Female",
    color: "#ec4899",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const [selectedYear, setSelectedYear] = useState<string>("0");
  const [selectedCourse, setSelectedCourse] = useState<string>("0");

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
  } = useAnalyticsDashboard();
  const { data: coursesData } = useCourses();
  const courses = useMemo(() => {
    return [
      { value: "0", label: "All Courses" },
      ...(coursesData || []).map((c: any) => ({
        value: c.id.toString(),
        label: c.code,
      })),
    ];
  }, [coursesData]);
  const { data: enrollmentYears } = useEnrollmentYears();

  const [hasSetDefaultYear, setHasSetDefaultYear] = useState(false);

  useEffect(() => {
    if (settings?.currentYearStart && !hasSetDefaultYear) {
      const yearStr = settings.currentYearStart.toString();
      setSelectedYear(yearStr);
      setHasSetDefaultYear(true);
      refresh(settings.currentYearStart, parseInt(selectedCourse), 0);
    } else if (!settings && !isSettingsLoading && !hasSetDefaultYear) {
      const fallbackYear = new Date().getFullYear();
      setSelectedYear(fallbackYear.toString());
      setHasSetDefaultYear(true);
      refresh(fallbackYear, parseInt(selectedCourse), 0);
    }
  }, [
    settings,
    isSettingsLoading,
    hasSetDefaultYear,
    selectedCourse,
    refresh,
  ]);

  // Update filters and refresh
  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    refresh(parseInt(val), parseInt(selectedCourse), 0);
  };

  const handleCourseChange = (val: string) => {
    setSelectedCourse(val);
    refresh(parseInt(selectedYear), parseInt(val), 0);
  };

  const yearOptions = useMemo(() => {
    const years = [...(enrollmentYears || [])];
    const currentYear = settings?.currentYearStart;
    if (currentYear && !years.includes(currentYear)) {
      years.unshift(currentYear);
    }
    return years.map((y: number) => ({
      value: y.toString(),
      label: y.toString(),
    }));
  }, [enrollmentYears, settings]);

  const headerActions = useMemo(
    () => (
      <div className="flex gap-4">
        <Dropdown
          name="year"
          get="value"
          identifier="value"
          value={selectedYear}
          onChange={handleYearChange}
          options={yearOptions}
          formStyle={false}
        />

        <Dropdown
          name="course"
          get="value"
          identifier="value"
          value={selectedCourse}
          onChange={handleCourseChange}
          options={courses}
          formStyle={false}
        />

        <Button
          variant="outline"
          disabled={isDownloading}
          onClick={() =>
            generatePreview(parseInt(selectedYear), parseInt(selectedCourse))
          }
          className={cn(
            "border-glass-border/40 hover:border-glass-border/60",
            "dark:focus:bg-glass-bg/40 flex h-11 w-full items-center",
            "justify-between rounded-xl border bg-muted/20 px-4",
            "py-2.5 text-left text-sm font-medium tracking-tight",
            "text-foreground shadow-sm outline-none transition-all",
            "duration-200 focus:border-primary/50 focus:bg-glass-bg",
            "focus:ring-2 focus:ring-primary/5",
          )}
        >
          <FileDown className="h-4 w-4" />
          <span>Download Report</span>
        </Button>
      </div>
    ),
    [
      selectedYear,
      handleYearChange,
      yearOptions,
      selectedCourse,
      handleCourseChange,
      courses,
      isDownloading,
      generatePreview,
    ],
  );

  const pageBadgeIcon = useMemo(() => <TrendingUp className="h-4 w-4" />, []);

  usePageMetadata({
    title: "Student Analytics",
    description:
      "Holistic analysis of student demographics, academic background, " +
      "and social profiles",
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
            refresh(parseInt(selectedYear), parseInt(selectedCourse), 0)
          }
          className="mt-4 border-primary/20 hover:bg-primary/5"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (!data) return null;

  return (
    <>
      <FullScreenLoader
        isLoading={isDownloading}
        message="Generating Document..."
      />
      <div className="animate-in fade-in space-y-8 duration-700">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Gender Distribution Chart */}
          <ChartCard
            title="Gender Distribution"
            description="Total student body split"
            className="lg:col-span-1"
          >
            <ChartContainer
              config={genderDistributionConfig}
              className="mx-auto aspect-square max-h-[300px]"
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
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="category"
                  isAnimationActive={false}
                >
                  {(data?.genderDistribution ?? []).map((gender) => (
                    <Cell
                      key={gender.category}
                      fill={
                        gender.category === "Male"
                          ? "var(--color-Male)"
                          : "var(--color-Female)"
                      }
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>

          {/* Right Columns: KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            <KPICard
              title="Total Population"
              value={data?.totalStudents?.toLocaleString() ?? "0"}
              subtitle="Enrolled Students"
              icon={<Users className="h-5 w-5 text-primary" />}
              gradient="from-primary/10 via-background to-background"
            />
            <KPICard
              title="Gender Balance"
              value={
                data?.genderDistribution?.[0]
                  ? `${data.genderDistribution[0].totalPct}%`
                  : "0%"
              }
              subtitle={`${
                data?.genderDistribution?.[0]?.category || "N/A"
              } Majority`}
              icon={<Network className="h-5 w-5 text-indigo-500" />}
              gradient="from-indigo-500/10 via-background to-background"
            />
            <KPICard
              title="Top Location"
              value={data?.cityAddress?.[0]?.category || "None"}
              subtitle="Primary Residence"
              icon={<MapPin className="h-5 w-5 text-emerald-500" />}
              gradient="from-emerald-500/10 via-background to-background"
            />
            <KPICard
              title="Metric Depth"
              value={(Object.keys(data || {}).length - 1).toString()}
              subtitle="Datasets Analyzed"
              icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
              gradient="from-amber-500/10 via-background to-background"
            />
          </div>
        </div>

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
                    "flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2",
                    "text-sm font-semibold text-white transition-colors hover:bg-emerald-600",
                  )}
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </ResponsiveModalHeader>
            <div className="flex-1 overflow-hidden bg-muted/20">
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
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

// --- HELPER COMPONENTS ---

const KPICard = React.memo(
  ({ title, value, subtitle, icon, gradient }: any) => {
    return (
      <Card
        className={`shadow-premium overflow-hidden border-none bg-gradient-to-br ${gradient}`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            {title}
          </CardTitle>
          <div className="rounded-xl p-2 shadow-sm">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{value}</div>
          <p className="mt-1 text-[10px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        </CardContent>
      </Card>
    );
  },
);

const ChartCard = React.memo(
  ({ title, description, children, className }: any) => {
    return (
      <Card
        className={`shadow-premium overflow-hidden border-primary/5 bg-card/40 backdrop-blur-sm ${className}`}
      >
        <CardHeader className="border-b border-primary/5 bg-muted/5 pb-2">
          <CardTitle className="text-base font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    );
  },
);

const CityDistributionCard = React.memo(({ data }: { data: any[] }) => {
  const [cityPage, setCityPage] = useState(0);
  const CITY_PAGE_SIZE = 10;

  return (
    <ChartCard
      title="City Distribution"
      description={`Page ${cityPage + 1} of ${Math.ceil((data?.length || 0) / CITY_PAGE_SIZE)} cities`}
      className="lg:col-span-3"
    >
      <div className="space-y-6">
        <ChartContainer
          config={genderSplitConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <BarChart
            layout="vertical"
            data={data.slice(
              cityPage * CITY_PAGE_SIZE,
              (cityPage + 1) * CITY_PAGE_SIZE,
            )}
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              width={110}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend
              verticalAlign="top"
              height={36}
            />
            <Bar
              isAnimationActive={false}
              name="Male"
              dataKey="maleCount"
              fill="var(--color-maleCount)"
              radius={[0, 4, 4, 0]}
              barSize={15}
            />
            <Bar
              isAnimationActive={false}
              name="Female"
              dataKey="femaleCount"
              fill="var(--color-femaleCount)"
              radius={[0, 4, 4, 0]}
              barSize={15}
            />
            <Bar
              isAnimationActive={false}
              name="Total"
              dataKey="total"
              fill="var(--color-total)"
              radius={[0, 4, 4, 0]}
              barSize={15}
              opacity={0.3}
            />
          </BarChart>
        </ChartContainer>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCityPage((p) => Math.max(0, p - 1))}
            disabled={cityPage === 0}
            className="h-8 text-[10px] font-bold uppercase"
          >
            Previous
          </Button>
          <div className="text-[10px] font-medium uppercase text-muted-foreground">
            Showing {cityPage * CITY_PAGE_SIZE + 1} -{" "}
            {Math.min((cityPage + 1) * CITY_PAGE_SIZE, data?.length || 0)} of{" "}
            {data?.length || 0}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCityPage((p) => p + 1)}
            disabled={(cityPage + 1) * CITY_PAGE_SIZE >= (data?.length || 0)}
            className="h-8 text-[10px] font-bold uppercase"
          >
            Next
          </Button>
        </div>
      </div>
    </ChartCard>
  );
});

function StatSummaryCard({ title, data, className }: any) {
  const topAddress = data.cityAddress[0]?.category || "N/A";
  const topNature = data.natureOfSchooling[0]?.category || "N/A";
  const topOrdinal = data.ordinalPosition[0]?.category || "N/A";

  return (
    <StatCard
      title={title}
      description="Key insights and dominant categories"
      className={className}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <InsightItem
          label="Primary Location"
          value={topAddress}
          icon={<MapPin className="h-4 w-4" />}
        />
        <InsightItem
          label="Enrollment Nature"
          value={topNature}
          icon={<Home className="h-4 w-4" />}
        />
        <InsightItem
          label="Family Position"
          value={topOrdinal}
          icon={<Network className="h-4 w-4" />}
        />
      </div>
    </StatCard>
  );
}

function StatCard({ title, description, children, className }: any) {
  return (
    <Card
      className={`shadow-premium overflow-hidden border-primary/5 bg-card/40 backdrop-blur-sm ${className}`}
    >
      <CardHeader className="border-b border-primary/5 bg-muted/5 pb-2">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function InsightItem({ label, value, icon }: any) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background p-4">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-32 w-full rounded-2xl"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[400px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );
}

const MiniBarChart = React.memo(
  ({ title, data }: { title: string; data: any[] }) => {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          {title}
        </p>
        <ChartContainer
          config={genderSplitConfig}
          className="aspect-auto h-[120px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              isAnimationActive={false}
              name="Male"
              dataKey="maleCount"
              fill="var(--color-maleCount)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              isAnimationActive={false}
              name="Female"
              dataKey="femaleCount"
              fill="var(--color-femaleCount)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    );
  },
);
