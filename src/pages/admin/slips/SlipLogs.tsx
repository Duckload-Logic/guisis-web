import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";
import {
  useSlipLogs,
  useGetSlipStats,
  useGetSlipCategories,
} from "@/features/slips/hooks";
import type { Slip, SlipStatus } from "@/features/slips/types";
import { SlipList } from "@/features/slips/components";
import { getMonthsList, getYearsList, getMonthRange } from "@/utils";
import { Dropdown } from "@/components/form";
import { usePageMetadata } from "@/context";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/shared/ReportModal";
import { slipService } from "@/features/slips/services";
import { cn } from "@/lib/utils";

export default function SlipLogs() {
  const navigate = useNavigate();

  // Memoize year and month lists to keep them stable across renders
  const monthsList = useMemo(() => getMonthsList(), []);
  const yearsList = useMemo(() => getYearsList(), []);

  // State for Year/Month filtering
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<{
    id: number;
    name: string;
  }>(() => {
    const found = yearsList.find(
      (y) => y.name === String(currentDate.getFullYear()),
    );
    return found || yearsList[0];
  });
  const [selectedMonth, setSelectedMonth] = useState<{
    id: number;
    name: string;
  }>(() => {
    const found = monthsList.find((m) => m.id === currentDate.getMonth() + 1);
    return found || monthsList[0];
  });

  // Handle year/month selection from Dropdown
  const handleYearChange = (yearId: number) => {
    const year = yearsList.find((y) => y.id === yearId);
    if (year) setSelectedYear(year);
  };

  const handleMonthChange = (monthId: number) => {
    const month = monthsList.find((m) => m.id === monthId);
    if (month) setSelectedMonth(month);
  };

  // State for other filters
  const [statusFilter, setStatusFilter] = useState<string>("0");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: slipCategories } = useGetSlipCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState<Slip[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const handleGenerateReport = async () => {
    setIsReportLoading(true);
    try {
      const response = await slipService.GetAllSlips({
        pageSize: 1000,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setReportData(response.slips || []);
      setIsReportOpen(true);
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Get date range from selected year/month
  const dateRange = useMemo(() => {
    const year = parseInt(selectedYear.name);
    const month = selectedMonth.id;
    return getMonthRange(year, month);
  }, [selectedYear, selectedMonth]);

  // Fetch logs with year/month and other filters
  const { data, isLoading } = useSlipLogs({
    page: currentPage,
    statusId: statusFilter !== "0" ? statusFilter : undefined,
    categoryId:
      selectedCategory !== "all" ? selectedCategory : undefined,
    search: debouncedSearch,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: slipStats = [], isLoading: isStatsLoading } = useGetSlipStats({
    params: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      categoryId:
        selectedCategory !== "all" ? selectedCategory : undefined,
    },
  });
  const slipStatusesWithAll = useMemo(() => {
    const totalCount = (slipStats ?? []).reduce(
      (sum: number, stat: any) => sum + (stat.count || 0),
      0,
    );

    return [
      {
        id: 0,
        name: "All Status",
        count: totalCount,
      },
      ...slipStats,
    ];
  }, [slipStats]);

  // Extract slips and total pages from response
  const slips = data?.slips || [];
  const totalPages = data?.totalPages || 1;

  // Calculate total count for the selected month
  const totalCountForMonth = useMemo(() => {
    return data?.total || slips.length;
  }, [data, slips]);

  // Handle actions
  const handleViewSlip = (slip: Slip) => {
    navigate(`/admin/slips/${slip.id}`);
  };

  const isPageLoading = isLoading || isStatsLoading;

  usePageMetadata({
    title: "Admission Slip Logs",
    description:
      "Historical record of all processed admission slips with " +
      "date and status filters",
    badgeText: "Audit Trail",
    badgeIcon: <Calendar className="h-4 w-4" />,
    isLoading: isPageLoading,
  });

  return (
    <>
      <div
        className={cn(
          "mx-auto flex w-full flex-col space-y-8 pb-12",
          "px-4 sm:px-6 md:px-8",
        )}
      >
        {/* Filters Section */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.05s", animationFillMode: "both" }}
        >
          <Card
            className={cn(
              "bg-glass-bg/40 border-glass-border shadow-md",
              "backdrop-blur-md transition-all duration-300 hover:shadow-lg",
            )}
          >
            <CardHeader className="border-border/40 border-b bg-muted/20 px-6 py-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-foreground/90">
                <Calendar className="h-5 w-5 text-primary" />
                Filter by Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Dropdown
                  label="Year"
                  options={yearsList}
                  value={selectedYear.id}
                  onChange={handleYearChange}
                />
                <Dropdown
                  label="Month"
                  options={monthsList}
                  value={selectedMonth.id}
                  onChange={handleMonthChange}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isReportLoading}
                  className="flex items-center gap-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <FileText className="h-4 w-4" />
                  {isReportLoading ? "Generating..." : "Generate Monthly Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slips List Section */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.10s", animationFillMode: "both" }}
        >
          <SlipList
            title="Submission Details"
            slips={slips}
            isLoading={isLoading}
            onViewClick={handleViewSlip}
            searchTerm={searchTerm}
            onSearchChange={(value: string) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
            statuses={slipStatusesWithAll as any}
            selectedStatus={{ id: statusFilter } as any}
            statusCounts={slipStats || []}
            onStatusChange={(status: SlipStatus) => {
              setStatusFilter(status.id);
              setCurrentPage(1);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            categories={slipCategories || []}
          />
        </div>

        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          type="slips"
          monthName={selectedMonth.name}
          yearName={selectedYear.name}
          data={reportData}
        />
      </div>
    </>
  );
}
