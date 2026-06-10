import NotificationBell from "@/features/notifications/components/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { IDPLoginButton } from "@/features/auth/components/IDPLoginButton";
import ProfileMenu from "./ProfileMenu";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 grid w-full grid-cols-[auto,1fr,auto] items-center",
        "h-20 border",
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
        <div className="flex flex-col gap-1 text-xs">
          <p className="font-semibold">
            Polytechnic University of the Philippines – Taguig
          </p>
          <p className="text-foreground/50">
            Guidance Services Information System
          </p>
        </div>
      </div>

      {!isLoggedIn && (
        <nav className="hidden items-center justify-center gap-8 md:flex">
          {isLanding ? (
            <a
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById("top")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Home
            </a>
          ) : (
            <Link
              to={isLoggedIn && role ? `/${role}` : "/"}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Home
            </Link>
          )}
          {isLanding ? (
            <>
              <a
                href="#features"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                What We Offer
              </a>
              <a
                href="#about"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("about")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Contact
              </a>
            </>
          ) : (
            <>
              <Link
                to="/about"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Contact Us
              </Link>
            </>
          )}
        </nav>
      )}

      <div className="flex items-center justify-end gap-3">
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {!isLoggedIn ? (
          <IDPLoginButton className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-amber-500" />
        ) : (
          <>
            <NotificationBell
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
            />
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
          </>
        )}
      </div>
      <UISettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
