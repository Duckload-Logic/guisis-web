import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  LogOut,
  Gavel,
  ShieldCheck,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import { UserRole } from "@/features/users/types/user";

const ROLE_ROUTES: Record<string, string> = {
  student: "/student",
  admin: "/admin",
  counselor: "/admin",
  superadmin: "/superadmin",
  developer: "/developer",
};

interface ProfileMenuProps {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  roleLabel: string;
  section?: string;
  studentNumber?: string;
  profilePath: string;
  role: string;
  onLogout: () => void;
}

export default function ProfileMenu({
  firstName,
  middleName,
  lastName,
  roleLabel,
  role,
  section,
  studentNumber,
  profilePath,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isStudent, activeRole, setActiveRole } = useAuth();

  const handleRoleSwitch = (r: UserRole) => {
    setActiveRole(r);
    const roleKey = r.name.toLowerCase().replace(/\s+/g, "");
    navigate(ROLE_ROUTES[roleKey] || "/");
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div
        className="relative z-[9999]"
        ref={menuRef}
      >
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 rounded p-2 text-foreground",
            "transition hover:bg-muted/30",
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={getProfilePictureUrl(user?.profilePicture)} />
            <AvatarFallback className="text-xs font-semibold text-foreground">
              {firstName?.charAt(0)}
              {lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm text-foreground md:block">
            {roleLabel}
          </span>
        </button>

        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "animate-in fade-in zoom-in-95 absolute right-0 isolate",
              "z-[9999] mt-2 w-72 overflow-hidden rounded-xl border",
              "border-border bg-card text-card-foreground shadow-xl",
            )}
          >
            <button
              onClick={() => {
                navigate(profilePath);
                setOpen(false);
              }}
              className="w-full border-b border-border p-4 text-left transition hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getProfilePictureUrl(user?.profilePicture)} />
                  <AvatarFallback className="font-semibold">
                    {firstName?.charAt(0)}
                    {lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {firstName} {middleName ? middleName[0] + "." : ""}{" "}
                    {lastName}
                  </p>

                  {section && studentNumber ? (
                    <p className="text-xs text-muted-foreground">
                      {section} • {studentNumber}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  )}
                </div>
              </div>
            </button>

            {isStudent && (
              <button
                onClick={() => {
                  navigate("/student/cor-management");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm",
                  "transition hover:bg-muted",
                )}
              >
                <FileText size={16} />
                <span>COR Management</span>
              </button>
            )}


            {user && user.roles && user.roles.length > 1 && (
              <div className="border-b border-border py-2">
                <p
                  className={
                    "px-4 py-1.5 text-[10px] font-semibold " +
                    "uppercase tracking-wider text-muted-foreground"
                  }
                >
                  Switch Workspace
                </p>
                <div
                  className={
                    "max-h-[160px] overflow-y-auto " +
                    "px-2 py-1 space-y-1"
                  }
                >
                  {user.roles.map((r) => {
                    const isActive = r.id === activeRole?.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRoleSwitch(r)}
                        className={cn(
                          "flex w-full items-center gap-2.5 " +
                            "rounded-lg px-3 py-2 text-left " +
                            "text-xs transition-all",
                          isActive
                            ? "bg-primary/10 font-semibold " +
                                "text-primary"
                            : "hover:bg-muted text-muted-foreground " +
                                "hover:text-foreground",
                        )}
                      >
                        <LayoutDashboard size={14} />
                        <span className="flex-1 truncate">{r.name}</span>
                        {isActive && (
                          <div
                            className={
                              "h-1.5 w-1.5 rounded-full " +
                              "bg-primary"
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm",
                "transition hover:bg-muted",
              )}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <a
              href="https://www.pup.edu.ph/terms/"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-muted"
            >
              <Gavel size={16} />
              <span>Terms of Service</span>
            </a>

            <a
              href="https://www.pup.edu.ph/privacy/"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-muted"
            >
              <ShieldCheck size={16} />
              <span>Privacy Policy</span>
            </a>

            <button
              onClick={onLogout}
              className={cn(
                "flex w-full items-center gap-3 border-t border-border px-4",
                "py-3 text-sm text-red-500 transition hover:bg-red-500/10",
              )}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>

      <UISettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
