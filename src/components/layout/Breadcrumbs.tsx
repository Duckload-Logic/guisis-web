import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import BackNav from "./BackNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

const PATH_LABELS: Record<string, string> = {
  home: "Dashboard",
  appointments: "Appointments",
  slips: "Admission Slips",
  "student-records": "Student Records",
  reports: "Reports",
  analytics: "Analytics",
  "api-management": "API Management",
  "security-logs": "Security Logs",
  "system-logs": "System Logs",
  "audit-logs": "Audit Logs",
  schedule: "Schedule",
  logs: "Logs",
  submit: "Submit",
  form: "IIR Form",
  iir: "IIR Profile",
  profile: "Profile",
  lifecycle: "Records Lifecycle",
};

interface BreadcrumbItem {
  label: string;
  to: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumbs on main dashboard pages
  const isMainPage =
    pathnames.length <= 1 ||
    (pathnames.length === 2 && pathnames[1] === "home");
  if (isMainPage) return null;

  const items: BreadcrumbItem[] = [];

  for (let i = 0; i < pathnames.length; i++) {
    const value = pathnames[i];

    // Skip first segment if it's just the role prefix
    if (i === 0 && ["admin", "student"].includes(value)) {
      continue;
    }

    const isId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ) || /^\d+$/.test(value);

    if (isId) {
      if (i + 1 < pathnames.length) {
        continue;
      } else {
        items.push({
          label: "Details",
          to: `/${pathnames.slice(0, i + 1).join("/")}`,
        });
      }
    } else {
      let label =
        PATH_LABELS[value] ||
        value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");

      const prevValue = i > 0 ? pathnames[i - 1] : "";
      const isPrevId =
        prevValue &&
        (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          prevValue,
        ) ||
          /^\d+$/.test(prevValue));

      if (isPrevId) {
        label = `${label} Details`;
      }

      items.push({
        label,
        to: `/${pathnames.slice(0, i + 1).join("/")}`,
      });
    }
  }

  const role = pathnames[0];
  const rootPath = ["admin", "student", "superadmin", "developer"].includes(
    role,
  )
    ? `/${role}`
    : "/";

  const parentPath = items.length > 1 ? items[items.length - 2].to : rootPath;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex w-full flex-wrap items-center gap-2 sm:gap-3"
    >
      <BackNav
        to={parentPath}
        className=""
      />

      <div className="mx-1 h-4 w-[1px] bg-border" />

      <ol
        className={cn(
          "flex items-center gap-2 overflow-hidden",
          "text-sm font-medium",
        )}
      >
        <li className="flex items-center">
          <Link
            to={pathnames[0] === "admin" ? "/admin" : "/student"}
            className={cn(
              "flex items-center text-muted-foreground",
              "transition-colors hover:text-primary",
            )}
          >
            <Home
              size={14}
              className="mr-1.5"
            />
            <span className="xs:inline hidden">Home</span>
          </Link>
        </li>
        {!isMobile &&
          items.map((item, index) => {
            const last = index === items.length - 1;

            return (
              <React.Fragment key={item.to}>
                <li className="flex items-center text-muted-foreground/50">
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                  />
                </li>
                <li className="flex items-center">
                  {last ? (
                    <span
                      className={cn(
                        "max-w-[150px] truncate font-semibold",
                        "text-foreground sm:max-w-[250px]",
                      )}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      to={item.to}
                      className={cn(
                        "max-w-[100px] truncate text-muted-foreground",
                        "transition-colors hover:text-primary",
                        "sm:max-w-[150px]",
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
      </ol>
    </nav>
  );
}
