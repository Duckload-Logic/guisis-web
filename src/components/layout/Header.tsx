import NotificationBell from "@/features/notifications/components/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useUI } from "@/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { API_ROUTES } from "@/config/apiRoutes";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";

import { User } from "@/features/users/types/user";

const LOGO_SRC = "/logo.svg";

const LANDING_NAV_ITEMS = [
  { label: "Home", id: "top" },
  { label: "About", id: "about" },
  { label: "Services", id: "services" },
  { label: "Contact", id: "contact" },
  { label: "FAQ", id: "faq" },
] as const;

interface HeaderProps {
  user: User | Record<string, any> | null;
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
  const navigate = useNavigate();

  const isProd = import.meta.env.VITE_IS_PRODUCTION === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const authorizeUrl = API_ROUTES.auth.idpAuthorizeUrl;
  const loginUrl = isProd ? `${apiBase}${authorizeUrl}` : "/login";

  const handleLogin = () => {
    setMobileMenuOpen(false);
    if (isProd) window.open(loginUrl, "_self");
    else navigate(loginUrl);
  };

  const handleNavClick = (targetId: string) => {
    setMobileMenuOpen(false);
    const resolvedId = targetId === "features" ? "services" : targetId;
    const element = document.getElementById(resolvedId);
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
          "pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-16",
          "items-center justify-between border-b border-border/70 px-3",
          "bg-background/95 shadow-sm backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/85",
          "min-[1025px]:inset-x-4 min-[1025px]:top-4 min-[1025px]:h-auto",
          "min-[1025px]:border-0 min-[1025px]:bg-transparent",
          "min-[1025px]:px-0 min-[1025px]:shadow-none",
          "min-[1025px]:backdrop-blur-none",
          "min-[1025px]:supports-[backdrop-filter]:bg-transparent",
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
            "pointer-events-auto ml-auto flex items-center gap-1",
            "min-[1025px]:rounded-xl min-[1025px]:border",
            "min-[1025px]:border-border/70 min-[1025px]:bg-background/85",
            "min-[1025px]:p-1 min-[1025px]:shadow-md",
            "min-[1025px]:backdrop-blur-xl",
            "min-[1025px]:supports-[backdrop-filter]:bg-background/70",
          )}
          aria-label="Account controls"
        >
          <ThemeToggle
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

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

      {!isLoggedIn && isLanding && (
        <nav className="mr-5 hidden min-w-0 items-center justify-end gap-4 lg:gap-8 xl:flex">
          {LANDING_NAV_ITEMS.map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                handleNavClick(id);
              }}
              className={cn(
                "text-sm font-medium text-foreground/70 transition-colors",
                "hover:text-foreground",
              )}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <Button
          size="sm"
          className={cn(
            "hidden font-semibold shadow-sm transition-transform",
            "gap-1.5 hover:-translate-y-0.5 sm:inline-flex",
          )}
          onClick={handleLogin}
        >
          Log In <ArrowRight className="h-3.5 w-3.5" />
        </Button>

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
              {LANDING_NAV_ITEMS.map(({ label, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNavClick(id);
                  }}
                  className={cn(
                    "border-b border-border/40 py-2 text-sm font-medium",
                    "text-foreground/70 transition-colors hover:text-foreground",
                  )}
                >
                  {label}
                </a>
              ))}
              <Button
                size="sm"
                className="mt-2 w-full gap-1.5 font-semibold shadow-sm"
                onClick={handleLogin}
              >
                Log In <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
