import NotificationBell from "@/features/notifications/components/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useUI } from "@/context";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const LOGO_SRC = "/logo.svg";

interface HeaderProps {
  user: any;
  role: string;
  handleLogout: () => void;
  getRoleLabel: () => string;
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
  isLoggedIn: boolean;
}

export default function Header({
  user,
  role,
  handleLogout,
  getRoleLabel,
  showNotifications,
  setShowNotifications,
  isLoggedIn = true,
}: HeaderProps) {
  const { darkMode, setDarkMode } = useUI();
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

  if (isLoggedIn) {
    return (
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-16 items-center justify-between px-3",
          "border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/85",
          "dark:border-white/10 dark:bg-neutral-950/95",
          "min-[1025px]:inset-x-4 min-[1025px]:top-4 min-[1025px]:h-auto min-[1025px]:border-0 min-[1025px]:bg-transparent min-[1025px]:px-0",
          "min-[1025px]:shadow-none min-[1025px]:backdrop-blur-none min-[1025px]:supports-[backdrop-filter]:bg-transparent",
          "min-[1025px]:dark:bg-transparent",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2 xl:hidden">
          <img
            src={LOGO_SRC}
            alt="Logo"
            className={cn(
              "h-10 w-10 shrink-0 rounded-full p-0.5 opacity-100",
              "bg-background shadow-sm",
              "min-[1025px]:bg-background/50 min-[1025px]:backdrop-blur-md",
            )}
          />
          <div className="flex flex-col gap-0 text-[11px] leading-tight opacity-100">
            <p className="font-bold text-foreground drop-shadow-sm">
              PUP Taguig
            </p>
            <p className="font-semibold text-primary drop-shadow-sm min-[1025px]:text-primary/90">
              GuiSIS
            </p>
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-auto ml-auto flex items-center gap-1 rounded-xl border",
            "border-border/70 bg-background/85 p-1 shadow-md backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/70",
            "dark:border-white/10 dark:bg-neutral-900/85",
          )}
          aria-label="Account controls"
        >
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

          <NotificationBell
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
          />

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
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center",
        "h-16 border-b border-glass-border bg-background px-3 shadow-md",
        "sm:h-20 sm:grid-cols-[auto,1fr,auto] sm:border sm:px-6",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-foreground sm:gap-3">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className={cn(
            "h-9 w-9 shrink-0 rounded-full transition-transform duration-200",
            "sm:h-12 sm:w-12",
          )}
        />
        <div className="flex min-w-0 flex-col gap-0.5 text-xs">
          <p className="hidden max-w-[min(48vw,34rem)] truncate font-semibold sm:block xl:max-w-none">
            Polytechnic University of the Philippines – Taguig
          </p>
          <p className="truncate font-semibold sm:hidden">PUP Taguig</p>
          <p className="hidden max-w-[min(42vw,28rem)] truncate text-foreground/50 sm:block xl:max-w-none">
            Guidance Services Information System
          </p>
          <p className="truncate text-foreground/50 sm:hidden">GuiSIS</p>
        </div>
      </div>

      {!isLoggedIn && (
        <nav className="mr-5 hidden min-w-0 items-center justify-end gap-4 lg:gap-8 xl:flex">
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
                href="#faq"
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick("faq");
                }}
                className={cn(
                  "text-sm font-medium text-foreground/70 transition-colors",
                  "hover:text-foreground",
                )}
              >
                FAQ
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

      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {!isLoggedIn ? (
          <>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "rounded-lg p-2 text-foreground hover:bg-muted xl:hidden",
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

            <div className="hidden xl:block">
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
            "border-glass-border bg-background p-6 shadow-lg xl:hidden",
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
                href="#faq"
                onClick={() => handleNavClick("faq")}
                className={cn(
                  "text-sm font-medium text-foreground/70",
                  "transition-colors hover:text-foreground",
                  "border-b border-border/40 py-2",
                )}
              >
                FAQ
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
    </header>
  );
}
