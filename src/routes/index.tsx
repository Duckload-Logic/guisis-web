import { RouteObject, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { IIRGate } from "@/features/auth/components/IIRGate";

// Shared
import Layout from "@/components/layout/Layout";
import NotFound from "@/components/shared/NotFound";

// Student Features
import StudentDashboard from "@/pages/student/Dashboard";
import StudentAppointments from "@/pages/student/appointments/StudentAppointments";
import StudentAppointmentDetails from "@/pages/student/appointments/AppointmentDetails";
import { StudentSlips, SubmitSlip } from "@/pages/student/slips";
import StudentSlipDetails from "@/pages/student/slips/SlipDetails";
import IIRProfile from "@/pages/student/iir/IIRProfile";
import IIRForm from "@/pages/student/iir/IIRForm";
import CORManagement from "@/pages/student/CORManagement";

// Admin Feature
import Dashboard from "@/pages/admin/Dashboard";
import StudentRecords from "@/pages/admin/StudentRecords";
import AppointmentsManagement from "@/pages/admin/appointments/AppointmentsManagement";
import AppointmentDetails from "@/pages/admin/appointments/AppointmentDetails";
import AppointmentLogs from "@/pages/admin/appointments/AppointmentLogs";
import ReviewSlips from "@/pages/admin/slips/ReviewSlips";
import SlipDetails from "@/pages/admin/slips/SlipDetails";
import SlipLogs from "@/pages/admin/slips/SlipLogs";
import Analytics from "@/pages/admin/Analytics";
import LifecycleManagement from "@/pages/admin/LifecycleManagement";
import CreateAppointment from "@/pages/student/appointments/CreateAppointment";
import Profile from "@/pages/shared/Profile";
import Callback from "@/pages/auth/Callback";
import NotificationsPage from "@/pages/shared/Notifications";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import RoleSelection from "@/pages/auth/RoleSelection";

// Super Admin Pages (Reverted to stable paths)
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import SAM2M from "@/pages/superadmin/M2MManagement";
import UserManagement from "@/pages/superadmin/UserManagement";
import AnalyticsOverview from "@/pages/superadmin/AnalyticsOverview";
import SecurityLogs from "@/pages/superadmin/SecurityLogs";
import SystemLogs from "@/pages/superadmin/SystemLogs";
import AuditLogs from "@/pages/superadmin/AuditLogs";
import UserActivity from "@/pages/superadmin/UserActivity";
import UserSessions from "@/pages/superadmin/UserSessions";
import LogDetails from "@/pages/superadmin/LogDetails";
import AcademicSettings from "@/pages/admin/AcademicSettings";

// Dev Portal Pages
import DevM2M from "@/pages/dev/M2MManagement";
import Documentation from "@/pages/dev/Documentation";
import Guides from "@/pages/dev/Guides";

export const routes: RouteObject[] = [
  // Root route - redirect to login
  {
    path: "/",
    element: (
      <Navigate
        to="/login"
        replace
      />
    ),
  },

  // Public routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // Student routes
  {
    path: "/student",
    element: (
      <ProtectedRoute requiredRole="student">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <IIRGate>
            <StudentDashboard />
          </IIRGate>
        ),
      },
      {
        path: "appointments",
        element: (
          <IIRGate>
            <StudentAppointments />
          </IIRGate>
        ),
      },
      {
        path: "appointments/:id",
        element: (
          <IIRGate>
            <StudentAppointmentDetails />
          </IIRGate>
        ),
      },
      {
        path: "appointments/schedule",
        element: (
          <IIRGate>
            <CreateAppointment />
          </IIRGate>
        ),
      },
      {
        path: "slips",
        element: (
          <IIRGate>
            <StudentSlips />
          </IIRGate>
        ),
      },
      {
        path: "slips/:id",
        element: (
          <IIRGate>
            <StudentSlipDetails />
          </IIRGate>
        ),
      },
      {
        path: "slips/submit",
        element: (
          <IIRGate>
            <SubmitSlip />
          </IIRGate>
        ),
      },
      {
        path: "slips/edit/:id",
        element: (
          <IIRGate>
            <SubmitSlip />
          </IIRGate>
        ),
      },
      {
        path: "iir",
        element: <IIRProfile />,
      },
      {
        path: "iir/form",
        element: <IIRForm />,
      },
      {
        path: "cor-management",
        element: (
          <IIRGate>
            <CORManagement />
          </IIRGate>
        ),
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "notifications",
        element: <NotificationsPage />,
      },
    ],
  },

  // Admin routes
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "student-records",
        element: <StudentRecords />,
      },
      {
        path: "student-records/:studentId",
        element: <IIRProfile />,
      },
      {
        path: "lifecycle",
        element: <LifecycleManagement />,
      },
      {
        path: "appointments",
        element: <AppointmentsManagement />,
      },
      {
        path: "appointments/:id",
        element: <AppointmentDetails />,
      },
      {
        path: "appointments/logs",
        element: <AppointmentLogs />,
      },
      {
        path: "slips",
        element: <ReviewSlips />,
      },
      {
        path: "slips/:id",
        element: <SlipDetails />,
      },
      {
        path: "slips/logs",
        element: <SlipLogs />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "notifications",
        element: <NotificationsPage />,
      },
      { path: "academic-settings", element: <AcademicSettings /> },
    ],
  },

  // SuperAdmin routes
  {
    path: "/superadmin",
    element: (
      <ProtectedRoute requiredRole="superadmin">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: "m2m-management", element: <SAM2M /> },
      { path: "users", element: <UserManagement /> },
      { path: "analytics", element: <AnalyticsOverview /> },
      { path: "security-logs", element: <SecurityLogs /> },
      { path: "system-logs", element: <SystemLogs /> },
      { path: "audit-logs", element: <AuditLogs /> },
      { path: "users/:userId/activity", element: <UserActivity /> },
      { path: "users/:userId/sessions", element: <UserSessions /> },
      { path: ":logType/:id", element: <LogDetails /> },
      { path: "profile", element: <Profile /> },
      { path: "notifications", element: <NotificationsPage /> },
    ],
  },

  // Developer routes
  {
    path: "/developer",
    element: (
      <ProtectedRoute requiredRole="developer">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DevM2M /> },
      { path: "docs", element: <Documentation /> },
      { path: "guides", element: <Guides /> },
      { path: "profile", element: <Profile /> },
      { path: "notifications", element: <NotificationsPage /> },
    ],
  },

  {
    path: "/auth/callback",
    element: <Callback />,
  },
  {
    path: "/auth/role-selection",
    element: (
      <ProtectedRoute>
        <RoleSelection />
      </ProtectedRoute>
    ),
  },

  // 404
  { path: "*", element: <NotFound /> },
];
