import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

export interface MonthlyVisitorStat {
  month: string;
  count: number;
}

export interface AdminDashboardResponse {
  totalStudents: number;
  studentsTrend: number;
  totalReports: number;
  reportsTrend: number;
  totalAppointments: number;
  appointmentsTrend: number;
  totalSlips: number;
  slipsTrend: number;
  monthlyVisitors: MonthlyVisitorStat[];
}

/**
 * Get Admin Dashboard analytics
 * @param filter Time filter (monthly, weekly, yearly)
 * @returns Admin dashboard analytics data
 */
export async function GetAdminDashboard(
  filter: string = "monthly",
): Promise<AdminDashboardResponse> {
  try {
    const response = await apiClient.get(API_ROUTES.analytics.adminDashboard, {
      params: { filter },
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export const analyticsService = {
  GetAdminDashboard,
};
