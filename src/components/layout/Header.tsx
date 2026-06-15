import NotificationBell from "@/features/notifications/components/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { IDPLoginButton } from "@/features/auth/components/IDPLoginButton";
import ProfileMenu from "./ProfileMenu";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useUI } from "@/context";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleNavClick = (targetId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 grid w-full grid-cols-[auto,1fr,auto] items-center",
        "h-16 border-b border-glass-border bg-background px-3 shadow-md",
        "sm:h-20 sm:border sm:px-6",
      )}
    >
      <div className="flex items-center gap-3 text-foreground">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className={cn(
            "h-10 w-10 rounded-full transition-transform duration-200",
            "hover:scale-110 sm:h-12 sm:w-12",
          )}
        />
        <div className="min-w-0 flex flex-col gap-0.5 text-xs">
          <p className="hidden font-semibold sm:block">
            Polytechnic University of the Philippines – Taguig
          </p>
          <p className="truncate font-semibold sm:hidden">PUP Taguig</p>
          <p className="hidden text-foreground/50 sm:block">
            Guidance Services Information System
          </p>
          <p className="truncate text-foreground/50 sm:hidden">GuiSIS</p>
        </div>
      </div>

      {!isLoggedIn && (
        <nav className="mr-5 hidden items-center justify-end gap-8 md:flex">
          {isLanding ? (
            <a
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                handleNavClick("top");
              }}
              className={cn(
                "text-sm font-medium text-foreground/70 transition-colors",
                "hover:text-foreground",
              )}
            >
              Home
            </a>
          ) : (
            <></>
          )}
          {isLanding ? (
            <>
              <a
                href="#features"
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick("features");
                }}
                className={cn(
                  "text-sm font-medium text-foreground/70 transition-colors",
                  "hover:text-foreground",
                )}
              >
                What We Offer
              </a>
              <a
                href="#about"
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick("about");
                }}
                className={cn(
                  "text-sm font-medium text-foreground/70 transition-colors",
                  "hover:text-foreground",
                )}
              >
                About
              </a>
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick("contact");
                }}
                className={cn(
                  "text-sm font-medium text-foreground/70 transition-colors",
                  "hover:text-foreground",
                )}
              >
                Contact
              </a>
            </>
          ) : (
            <></>
          )}
        </nav>
      )}

      <div className="flex items-center justify-end gap-3">
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {!isLoggedIn ? (
          <>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "rounded-lg p-2 text-foreground hover:bg-muted md:hidden",
                "transition-colors",
              )}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </>
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

      {/* Mobile Menu Dropdown */}
      {!isLoggedIn && mobileMenuOpen && (
        <div
          className={cn(
            "absolute left-0 top-20 z-20 flex w-full flex-col gap-4 border-b",
            "border-glass-border bg-background p-6 shadow-lg md:hidden",
            "animate-in slide-in-from-top-4 duration-200",
          )}
        >
          {isLanding && (
            <nav className="flex flex-col gap-4">
              <a
                href="#top"
                onClick={() => handleNavClick("top")}
                className={cn(
                  "text-sm font-medium text-foreground/70",
                  "transition-colors hover:text-foreground",
                  "border-b border-border/40 py-2",
                )}
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => handleNavClick("features")}
                className={cn(
                  "text-sm font-medium text-foreground/70",
                  "transition-colors hover:text-foreground",
                  "border-b border-border/40 py-2",
                )}
              >
                What We Offer
              </a>
              <a
                href="#about"
                onClick={() => handleNavClick("about")}
                className={cn(
                  "text-sm font-medium text-foreground/70",
                  "transition-colors hover:text-foreground",
                  "border-b border-border/40 py-2",
                )}
              >
                About
              </a>
              <a
                href="#contact"
                onClick={() => handleNavClick("contact")}
                className={cn(
                  "text-sm font-medium text-foreground/70",
                  "transition-colors hover:text-foreground",
                  "border-b border-border/40 py-2",
                )}
              >
                Contact
              </a>
            </nav>
          )}
        </div>
      )}

      <UISettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}

