import NotificationBell from "@/features/notifications/components/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { useState } from "react";

const LOGO_SRC = "/logo.svg";

interface HeaderProps {
  title?: string;
  user: any;
  role: string;
  handleLogout: () => void;
  getRoleLabel: () => string;
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
  isLoggedIn: boolean;
}

import { useUI } from "@/context";
import { cn } from "@/lib/utils";

export default function Header({
  title,
  user,
  role,
  handleLogout,
  getRoleLabel,
  showNotifications,
  setShowNotifications,
  isLoggedIn = true,
}: HeaderProps) {
  const { darkMode, setDarkMode } = useUI();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-20 items-center justify-between",
        "rounded-3xl rounded-tl-none rounded-tr-none border",
        "border-glass-border bg-background px-6 shadow-md",
      )}
    >
      <div className="flex items-center gap-3 text-foreground">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className={cn(
            "h-12 w-12 rounded-full transition-transform duration-200",
            "hover:scale-110",
          )}
        />
        <div className="hidden flex-col gap-1 text-xs md:flex">
          <p className="font-semibold">
            Polytechnic University of the Philippines – Taguig
          </p>
          <p className="text-foreground/50">
            Guidance Services Information System
          </p>
        </div>
      </div>

      {isLoggedIn && (
        <div className="text-center md:block">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-foreground/50">
            Welcome back, {user?.firstName}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {isLoggedIn && (
          <NotificationBell
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
          />
        )}

        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        {isLoggedIn && (
          <div className="hidden md:block">
            <ProfileMenu
              firstName={user?.firstName}
              middleName={user?.middleName}
              lastName={user?.lastName}
              roleLabel={getRoleLabel()}
              role={role}
              profilePath={`/${role}/profile`}
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>
      <UISettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
