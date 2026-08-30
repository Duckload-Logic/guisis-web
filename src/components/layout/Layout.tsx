import Header from "@/components/layout/Header";
import NotificationModal from "@/features/notifications/components/NotificationModal";

import Toast from "@/components/ui/Toast";
import { NAV_CONFIG } from "@/config/navigation";
import { Spinner } from "@/components/shared/Spinner";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useIIRStatus } from "@/features/iir/hooks";

import { useAuth, useUI, useToast } from "@/context";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import Navigation from "./Navigation";
import SubHeader from "./SubHeader";
import { SpeechControl } from "../shared/SpeechControl";
import { UISettingsModal } from "../shared/UISettingsModal";
import { AnimationStyles } from "../ui/animations";
import ScrollToTop from "@/utils/componentUtils";
import ConsentModal from "@/features/consents/components/ConsentModal";
import { cn } from "@/lib/utils";

const ROLE_STUDENT = "student";
const STUDENT_IIR_FORM_PATH = "/student/iir/form";

interface LayoutProps {
  showHeader?: boolean;
  children?: React.ReactNode;
  title?: string;
  subTitle?: string;
  headerChildren?: React.ReactNode;
  isLoggedIn?: boolean;
  isLoading?: boolean;
  description?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerStats?: React.ReactNode;
  showDate?: boolean;
}

export default function Layout({
  showHeader = true,
  children,
  title: propsTitle,
  subTitle: propsSubTitle,
  headerChildren,
  isLoggedIn = true,
  isLoading: propsIsLoading,
  description: propsDescription,
  badgeText: propsBadgeText,
  badgeIcon: propsBadgeIcon,
  headerActions: propsHeaderActions,
  headerStats: propsHeaderStats,
  showDate: propsShowDate,
}: LayoutProps) {
  const {
    sidebarPinned,
    sidebarHovered,
    setSidebarHovered,
    darkMode,
    setDarkMode,
    grayscale,
    setGrayscale,
    dyslexiaMode,
    setDyslexiaMode,
    fontScale,
    performanceMode,
    pageMetadata,
  } = useUI();

  const isExpanded = sidebarPinned || sidebarHovered;

  // Merge props with context metadata (props take precedence)
  const title = propsTitle || pageMetadata.title;
  const description =
    propsDescription || propsSubTitle || pageMetadata.description;
  const badgeText = propsBadgeText || pageMetadata.badgeText;
  const badgeIcon = propsBadgeIcon || pageMetadata.badgeIcon;
  const headerActions = propsHeaderActions || pageMetadata.headerActions;
  const headerStats = propsHeaderStats || pageMetadata.headerStats;
  const showDate =
    propsShowDate !== undefined
      ? propsShowDate
      : (pageMetadata.showDate ?? false);
  const isLoading =
    propsIsLoading !== undefined
      ? propsIsLoading
      : (pageMetadata.isLoading ?? false);

  const hasSubHeaderContent = Boolean(
    title ||
      description ||
      badgeText ||
      badgeIcon ||
      headerActions ||
      headerStats ||
      showDate,
  );

  const showSubHeader =
    pageMetadata.showSubHeader !== false && hasSubHeaderContent;

  const { user, logout, activeRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: iirStatus } = useIIRStatus();

  const currentRole = activeRole?.name?.toLowerCase();
  const showIIRWarning =
    isLoggedIn &&
    !!user &&
    currentRole === ROLE_STUDENT &&
    iirStatus?.isSubmitted &&
    !iirStatus?.isCompleted &&
    location.pathname !== STUDENT_IIR_FORM_PATH;

  const [sessionAccepted, setSessionAccepted] = useState(() => {
    // Check if they accepted during THIS specific browser session
    return sessionStorage.getItem("session_consent_accepted") === "true";
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [uiSettingsOpen, setUiSettingsOpen] = useState(false);
  const { toasts, triggerToast } = useToast();
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setUiSettingsOpen(true);
    window.addEventListener("open-ui-settings", handleOpen);
    return () => {
      window.removeEventListener("open-ui-settings", handleOpen);
    };
  }, []);

  const mustAcceptTerms = !sessionAccepted && !!user && isLoggedIn;

  useEffect(() => {
    setTermsOpen(mustAcceptTerms);
  }, [mustAcceptTerms]);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (dyslexiaMode) {
      document.body.classList.add("dyslexic-mode");
    } else {
      document.body.classList.remove("dyslexic-mode");
    }
  }, [dyslexiaMode]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  const handleLogout = () => {
    setSidebarHovered(false); // Reset sidebar state on logout
    logout();
  };

  const navigationItems = useMemo(() => {
    if (!user || !activeRole) return [];

    const roleKey = activeRole.name.toLowerCase().replace(/\s+/g, "");
    if (!roleKey) return [];

    return NAV_CONFIG[roleKey] || [];
  }, [user, activeRole]);

  const getRoleLabel = () => {
    if (!user || !activeRole) return "";
    const roleName = activeRole.name.toLowerCase();
    if (roleName === "admin") return "Admin Account";
    if (roleName === "superadmin") return "Super Admin Account";
    if (roleName === "developer") return "Developer Account";
    return "Student Account";
  };

  useEffect(() => {
    // Reset sidebar hovered state on navigation to ensure overlay is dismissed
    if (sidebarHovered) {
      setSidebarHovered(false);
    }
  }, [location.pathname, sidebarHovered, setSidebarHovered]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    if (termsOpen) {
      node.setAttribute("inert", "");
      node.setAttribute("aria-hidden", "true");
    } else {
      node.removeAttribute("inert");
      node.removeAttribute("aria-hidden");
    }
  }, [termsOpen]);

  const handleAcceptTerms = () => {
    if (!user) {
      triggerToast("");
      return;
    }

    try {
      sessionStorage.setItem("session_consent_accepted", "true");

      setSessionAccepted(true);
      setTermsOpen(false);

      triggerToast("Terms and Conditions accepted.");
    } catch (err) {
      triggerToast("Failed to accept terms. Please try again.");
    }
  };

  const handleDismissTerms = () => {
    logout();
  };

  return (
    <ErrorBoundary>
      <ScrollToTop targetRef={scrollRef as React.RefObject<HTMLDivElement>} />
      <div
        className={`relative flex h-dvh min-w-0 max-w-full flex-col overflow-hidden bg-neutral-100 text-foreground dark:bg-neutral-950 ${
          grayscale ? "grayscale" : ""
        }`}
      >
        {/* Background Fallback / Graphics Quality Layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {performanceMode ? (
            // Lighter Fallback: Simple static gradients
            <div
              className={cn(
                "absolute inset-0",
                "bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.05),transparent_20%),radial-gradient(ellipse_at_bottom_right,rgba(218,165,32,0.05),transparent_20%)]",
              )}
            />
          ) : (
            // High Quality: Animated Mesh pattern
            <div className="absolute inset-0 z-0">
              <div
                className={cn(
                  "absolute -left-[10%] top-[5%] h-[40rem] w-[40rem] animate-pulse",
                  "rounded-full bg-primary/20 blur-[100px] dark:bg-primary/5",
                )}
              />
              <div
                className={cn(
                  "absolute -bottom-[5%] -right-[10%] h-[40rem] w-[40rem]",
                  "animate-pulse rounded-full bg-secondary/20 blur-[100px] dark:bg-secondary/5",
                  "[animation-delay:3s]",
                )}
              />
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 h-[30rem] w-[30rem]",
                  "-translate-x-1/2 -translate-y-1/2 rounded-full",
                  "bg-primary/15 blur-[100px] dark:bg-primary/5",
                )}
              />
            </div>
          )}
          {/* Global Light Overlay */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.08))]",
              "dark:bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.01))]",
            )}
          />
        </div>

        <div
          ref={contentRef}
          className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ${
            termsOpen
              ? "pointer-events-none select-none opacity-40 grayscale-[0.5]"
              : ""
          }`}
        >
          {showHeader && (
            <>
              <Header
                title={title}
                user={user}
                role={currentRole || ""}
                handleLogout={handleLogout}
                getRoleLabel={getRoleLabel}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                isLoggedIn={isLoggedIn}
              />

              <NotificationModal
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />
            </>
          )}

          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col-reverse xl:flex-row">
            {/* <div
              className={cn(
    "absolute inset-0 z-0 bg-[url('/src/assets/images/bg.gif')]",
    "bg-cover bg-center bg-no-repeat opacity-[0.15]",
    "dark:opacity-10 transform-gpu"
  )}
            /> */}
            {isLoggedIn && (
              <Navigation
                navigationItems={navigationItems}
                location={location}
                user={user}
                handleLogout={handleLogout}
                role={currentRole || ""}
                roleLabel={getRoleLabel()}
              />
            )}

            <div
              className={cn(
                "relative h-full min-w-0 max-w-full flex-1 overflow-hidden",
              )}
            >
              <div
                ref={scrollRef}
                className={cn(
                  "relative flex h-full min-w-0 max-w-full flex-col",
                  "overflow-y-auto overflow-x-hidden overscroll-contain",
                  isLoggedIn ? "pb-24 xl:pb-6" : "pb-6",
                )}
              >
                <main
                  className={cn(
                    "responsive-page-shell min-w-0 max-w-full flex-1",
                    "p-3 sm:p-4 md:p-6 xl:p-8",
                    isLoading && "flex h-full flex-col",
                  )}
                >
                  {showIIRWarning && (
                    <div
                      className={cn(
                        "mb-6 flex flex-col sm:flex-row",
                        "gap-4 sm:items-center sm:justify-between",
                        "rounded-xl border border-yellow-500/20",
                        "bg-yellow-500/10 p-4 text-yellow-800",
                        "dark:text-yellow-200",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={cn(
                            "h-5 w-5 shrink-0",
                            "text-yellow-600 dark:text-yellow-400",
                          )}
                        />
                        <div className="text-sm font-medium">
                          You are currently using an expedited profile. Please
                          complete your Individual Inventory Record (IIR) to
                          gain full access.
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(STUDENT_IIR_FORM_PATH)}
                        className={cn(
                          "shrink-0 rounded-lg bg-yellow-600",
                          "px-4 py-2 text-xs hover:bg-yellow-700",
                          "font-semibold text-white shadow transition-colors",
                        )}
                      >
                        Complete Form
                      </button>
                    </div>
                  )}
                  {showHeader && showSubHeader && (
                    <SubHeader
                      title={title || ""}
                      description={description || propsSubTitle}
                      badgeText={badgeText}
                      badgeIcon={badgeIcon}
                      headerActions={headerActions}
                      headerStats={headerStats}
                      showDate={showDate}
                    />
                  )}
                  {isLoading ? (
                    <div
                      className={cn(
                        "flex w-full flex-1",
                        "items-center justify-center",
                      )}
                    >
                      <Spinner size="lg" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      isLoading ? "hidden" : "block",
                      "h-full min-w-0 max-w-full",
                    )}
                  >
                    {children || <Outlet />}
                  </div>
                </main>
              </div>

              {/* The Overlay: Handle both the dark tint and the blur here */}
              {sidebarHovered && !sidebarPinned && isLoggedIn && !termsOpen && (
                <div
                  className={cn(
                    "animate-in fade-in pointer-events-none absolute inset-0 z-20",
                    "bg-black/50 duration-200",
                  )}
                />
              )}
            </div>
          </div>
        </div>

        <ConsentModal
          open={termsOpen}
          role={currentRole || ROLE_STUDENT}
          loading={false}
          onAccept={handleAcceptTerms}
          onCancel={handleDismissTerms}
        />

        <Toast toasts={toasts} />
        <SpeechControl />
        <UISettingsModal
          isOpen={uiSettingsOpen}
          onClose={() => setUiSettingsOpen(false)}
        />
        <AnimationStyles />
      </div>
    </ErrorBoundary>
  );
}
