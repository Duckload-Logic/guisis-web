import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Settings,
  LogOut,
  ShieldCheck,
  Gavel,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUI, useAuth } from "@/context";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { cn } from "@/lib/utils";

const HOME_HREF = "/";
const SETTINGS_HREF = "/settings";
const LOGO_SRC = "/logo.svg";

/*
 * Desktop sidebar sizing.
 * 24px keeps a small breathing room while keeping the sidebar visually connected.
 */
const DESKTOP_LEFT_GUTTER = 12;
const EXPANDED_SIDEBAR_WIDTH = 256;
const COLLAPSED_SIDEBAR_WIDTH = 72;
const EDGE_CONTROL_SPACE = 20;

const EXPANDED_BRANDING_HEIGHT = 214;
const COLLAPSED_BRANDING_HEIGHT = 96;

/*
 * Animation timing.
 *
 * The shell and content do NOT start at exactly the same time:
 * - Collapse: content fades first, then the shell contracts.
 * - Expand: shell opens first, then content fades in.
 *
 * This staged sequence is what makes the motion visibly different from the
 * previous "everything changes at once" animation.
 */
const SHELL_DURATION = 380;
const PRE_COLLAPSE_DELAY = 90;
const EXPAND_CONTENT_DELAY = 135;
const SHELL_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const CONTENT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function NavItem({
  item,
  active,
  variant = "desktop",
  isExpanded = false,
  showExpandedContent = false,
  onClick,
}: {
  item: { label: string; href: string; icon: React.ReactNode };
  active: boolean;
  variant?: "desktop" | "mobile-bottom" | "mobile-drawer";
  isExpanded?: boolean;
  showExpandedContent?: boolean;
  onClick?: () => void;
}) {
  if (variant === "mobile-bottom") {
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`group flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl p-2 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <div className="flex h-6 w-6 items-center justify-center transition-transform group-hover:scale-110">
          {item.icon}
        </div>
      </Link>
    );
  }

  if (variant === "mobile-drawer") {
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-xl p-4 transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 hover:bg-muted"
        }`}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {item.icon}
        </div>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={!isExpanded ? item.label : undefined}
      className={cn(
        "sidebar-icon-tilt group flex cursor-pointer items-center gap-3",
        "rounded-xl px-3 py-3",
        "transition-[background-color,color,box-shadow] duration-200 ease-out",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm",
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        {item.icon}
      </div>

      <span
        className="min-w-0 overflow-hidden whitespace-nowrap"
        style={{
          maxWidth: showExpandedContent ? 190 : 0,
          opacity: showExpandedContent ? 1 : 0,
          transform: showExpandedContent
            ? "translate3d(0, 0, 0)"
            : "translate3d(-7px, 0, 0)",
          transition: showExpandedContent
            ? [
                `max-width 300ms ${CONTENT_EASING}`,
                "opacity 220ms ease-out",
                `transform 280ms ${CONTENT_EASING}`,
              ].join(", ")
            : [
                `max-width 190ms ${SHELL_EASING}`,
                "opacity 120ms ease-out",
                `transform 170ms ${SHELL_EASING}`,
              ].join(", "),
          willChange: "max-width, opacity, transform",
        }}
      >
        {item.label}
      </span>
    </Link>
  );
}

export default function Navigation({
  navigationItems,
  location,
  user,
  handleLogout,
  role,
  roleLabel,
}: {
  navigationItems: any[];
  location: any;
  user: any;
  handleLogout: () => void;
  role: string;
  roleLabel: string;
}) {
  const {
    sidebarPinned,
    setSidebarPinned,
    toggleSidebarPinned,
    setSidebarHovered,
  } = useUI();
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);



  const ROLE_ROUTES: Record<string, string> = {
    student: "/student",
    admin: "/admin",
    counselor: "/admin",
    superadmin: "/superadmin",
    developer: "/developer",
  };

  const handleRoleSwitch = (r: any) => {
    setActiveRole(r);

    const roleKey = r.name.toLowerCase().replace(/\s+/g, "");

    navigate(ROLE_ROUTES[roleKey] || "/");
    setSidebarHovered(false);
  };

  /*
   * visualExpanded controls the physical shell.
   * showExpandedContent controls branding/nav text.
   *
   * Keeping these separate lets us stage the motion instead of switching
   * every visual property on the same render.
   */
  const [visualExpanded, setVisualExpanded] = useState(sidebarPinned);
  const [showExpandedContent, setShowExpandedContent] = useState(sidebarPinned);

  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (sidebarPinned) {
      // EXPAND:
      // 1. Open shell immediately.
      // 2. Let the panel gain some width.
      // 3. Fade/slide the labels in.
      setVisualExpanded(true);

      animationTimerRef.current = setTimeout(() => {
        setShowExpandedContent(true);
        animationTimerRef.current = null;
      }, EXPAND_CONTENT_DELAY);
    } else {
      // COLLAPSE:
      // 1. Fade/slide labels out first.
      // 2. Contract the shell a fraction of a second later.
      setShowExpandedContent(false);

      animationTimerRef.current = setTimeout(() => {
        setVisualExpanded(false);
        animationTimerRef.current = null;
      }, PRE_COLLAPSE_DELAY);
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [sidebarPinned]);

  const isExpanded = visualExpanded;
  const isMobile = useIsMobile();

  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"menu" | "settings">("menu");
  const [uiSettingsOpen, setUiSettingsOpen] = useState(false);

  const isActive = (item: any) => {
    if (
      location.pathname === item.href ||
      location.pathname === `${item.href}/`
    ) {
      return true;
    }

    const isRootPath = [
      "/admin",
      "/student",
      "/superadmin",
      "/developer",
      "/",
    ].includes(item.href);

    if (isRootPath) {
      return false;
    }

    return location.pathname.startsWith(`${item.href}/`);
  };

  if (isMobile) {
    const overflowItems = navigationItems.filter(
      (item) => item.href !== HOME_HREF && item.href !== SETTINGS_HREF,
    );

    return (
      <>
        <div className="fixed inset-x-0 bottom-4 z-40 flex w-full justify-center px-4 xl:hidden">
          <div
            className={cn(
              "flex h-16 w-full max-w-sm items-center rounded-2xl border",
              "border-border bg-background/10 px-2 shadow-lg backdrop-blur-xl",
            )}
          >
            <nav className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto px-2 [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
              {navigationItems
                .filter((item) => item.href !== SETTINGS_HREF)
                .map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isActive(item)}
                    variant="mobile-bottom"
                  />
                ))}
            </nav>

            <div className="mx-1 h-8 w-px shrink-0 bg-border" />

            <button
              type="button"
              onClick={() => {
                setDrawerMode("settings");
                setOpenDrawer(true);
              }}
              className={`group flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center rounded-xl p-2 ${
                location.pathname.includes(SETTINGS_HREF)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              aria-label="Open settings"
            >
              <Settings className="h-6 w-6 transition-transform group-hover:rotate-45" />
            </button>
          </div>
        </div>

        <Drawer
          open={openDrawer}
          onOpenChange={setOpenDrawer}
          handleOnly
          fixed
          autoFocus={false}
        >
          <DrawerContent
            className="max-h-[85dvh] overflow-hidden"
            scrollClassName="space-y-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]"
          >
            {drawerMode === "menu" ? (
              <div className="space-y-3">
                <p className="px-2 text-xs font-bold text-muted-foreground">
                  NAVIGATION
                </p>

                {overflowItems.slice(2).map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isActive(item)}
                    variant="mobile-drawer"
                    onClick={() => setOpenDrawer(false)}
                  />
                ))}
              </div>
            ) : (
              <MobileSettingsContent
                user={user}
                role={role}
                roleLabel={roleLabel}
                onLogout={handleLogout}
                closeDrawer={() => setOpenDrawer(false)}
                onOpenUISettings={() => {
                  setOpenDrawer(false);
                  setUiSettingsOpen(true);
                }}
                activeRole={activeRole}
                onRoleSwitch={handleRoleSwitch}
              />
            )}
          </DrawerContent>
        </Drawer>

        <UISettingsModal
          isOpen={uiSettingsOpen}
          onClose={() => setUiSettingsOpen(false)}
        />
      </>
    );
  }

  const sidebarWidth = isExpanded
    ? EXPANDED_SIDEBAR_WIDTH
    : COLLAPSED_SIDEBAR_WIDTH;

  const brandingHeight = isExpanded
    ? EXPANDED_BRANDING_HEIGHT
    : COLLAPSED_BRANDING_HEIGHT;

  const navigationFootprint =
    DESKTOP_LEFT_GUTTER + sidebarWidth + EDGE_CONTROL_SPACE;

  return (
    <div
      className="relative z-40 hidden h-full shrink-0 items-center xl:flex"
      style={{
        width: navigationFootprint,
        transition: `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
        willChange: "width",
      }}
    >


      {/* 12px left gutter: small breathing room while staying visually connected. */}
      <div
        className="relative z-40 h-[calc(100%-1.5rem)]"
        style={{
          marginLeft: DESKTOP_LEFT_GUTTER,
          width: sidebarWidth,
          transition: `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
          willChange: "width",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        <aside
          ref={sidebarRef}
          className={cn(
            "relative z-50 flex h-full w-full flex-col overflow-visible rounded-3xl border",
            "border-glass-border bg-background/95 shadow-md backdrop-blur-xl",
            "dark:border-white/10 dark:bg-neutral-900/95",
          )}
        >
          <div
            className="relative shrink-0 overflow-visible border-b border-border/60 dark:border-white/10"
            style={{
              height: brandingHeight,
              transition: `height ${SHELL_DURATION}ms ${SHELL_EASING}`,
              willChange: "height",
              transform: "translateZ(0)",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <img
                src={LOGO_SRC}
                alt="Polytechnic University of the Philippines – Taguig logo"
                className="shrink-0 rounded-full object-contain"
                style={{
                  width: isExpanded ? 78 : 40,
                  height: isExpanded ? 78 : 40,
                  transform: isExpanded
                    ? "translate3d(0, -3px, 0)"
                    : "translate3d(0, 0, 0)",
                  transition: [
                    `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
                    `height ${SHELL_DURATION}ms ${SHELL_EASING}`,
                    `transform ${SHELL_DURATION}ms ${SHELL_EASING}`,
                  ].join(", "),
                  willChange: "width, height, transform",
                }}
              />

              <div
                className="w-full overflow-hidden"
                style={{
                  maxHeight: showExpandedContent ? 96 : 0,
                  marginTop: showExpandedContent ? 12 : 0,
                  opacity: showExpandedContent ? 1 : 0,
                  transform: showExpandedContent
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, -6px, 0)",
                  transition: showExpandedContent
                    ? [
                        `max-height 300ms ${CONTENT_EASING}`,
                        `margin-top 300ms ${CONTENT_EASING}`,
                        "opacity 220ms ease-out",
                        `transform 260ms ${CONTENT_EASING}`,
                      ].join(", ")
                    : [
                        `max-height 180ms ${SHELL_EASING}`,
                        `margin-top 180ms ${SHELL_EASING}`,
                        "opacity 110ms ease-out",
                        `transform 160ms ${SHELL_EASING}`,
                      ].join(", "),
                  willChange: "max-height, margin-top, opacity, transform",
                }}
              >
                <p className="mx-auto max-w-[13.5rem] text-sm font-bold leading-5 text-foreground">
                  Polytechnic University of the Philippines – Taguig
                </p>

                <p className="mx-auto mt-2 max-w-[13rem] text-xs font-medium leading-4 text-muted-foreground">
                  Guidance Services Information System
                </p>
              </div>
            </div>

            {/* Pod remains attached to the moving divider. */}
            <div
              className={cn(
                "absolute -right-[18px] bottom-0 z-[60]",
                "flex h-9 w-9 translate-y-1/2 items-center justify-center rounded-full",
                "border border-border/70 bg-background shadow-md",
                "dark:border-white/10 dark:bg-neutral-900",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setSidebarHovered(false);
                  toggleSidebarPinned();
                }}
                aria-label={
                  sidebarPinned ? "Collapse sidebar" : "Expand sidebar"
                }
                aria-expanded={sidebarPinned}
                title={sidebarPinned ? "Collapse Sidebar" : "Expand Sidebar"}
                className={cn(
                  "flex !h-[22px] !min-h-[22px] !w-[22px] !min-w-[22px]",
                  "items-center justify-center rounded-full border-0 !p-0",
                  "bg-primary text-primary-foreground shadow-sm",
                  "transition-[background-color,box-shadow] duration-200 ease-out",
                  "hover:bg-primary/90 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary/35 focus-visible:ring-offset-2",
                  "active:!transform-none",
                )}
              >
                <ChevronRight
                  className="block h-3 w-3 shrink-0"
                  style={{
                    transform: sidebarPinned
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: `transform 300ms ${SHELL_EASING}`,
                    willChange: "transform",
                  }}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-3 pt-7">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item)}
                isExpanded={isExpanded}
                showExpandedContent={showExpandedContent}
                variant="desktop"
              />
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

function MobileSettingsContent({
  user,
  role,
  roleLabel,
  onLogout,
  closeDrawer,
  onOpenUISettings,
  activeRole,
  onRoleSwitch,
}: any) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div
        onClick={() => {
          navigate(`/${role}/profile`);
          closeDrawer();
        }}
        className={cn(
          "flex cursor-pointer items-center gap-4 rounded-xl p-2",
          "transition hover:bg-muted/50",
        )}
      >
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div>
          <p className="font-bold">
            {user?.firstName} {user?.lastName}
          </p>

          <p className="text-xs text-muted-foreground">
            {activeRole?.name || roleLabel} Context
          </p>
        </div>
      </div>

      {user?.roles && user.roles.length > 1 && (
        <div className="space-y-3">
          <p className="px-2 text-[10px] uppercase text-muted-foreground/60">
            Switch Workspace
          </p>

          <div className="grid grid-cols-1 gap-2">
            {user.roles.map((r: any) => {
              const isActiveRole = r.id === activeRole?.id;

              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => onRoleSwitch(r)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 transition-all active:scale-95",
                    isActiveRole
                      ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                      : "border-border/50 bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-background",
                      isActiveRole && "bg-primary/20 text-primary",
                    )}
                  >
                    <LayoutDashboard size={20} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-bold">{r.name}</p>

                    <p className="text-[10px] text-muted-foreground">
                      Switch to {r.name.toLowerCase()} view
                    </p>
                  </div>

                  {isActiveRole && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="my-2 border-t border-border" />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenUISettings}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm",
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
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm",
            "transition hover:bg-muted",
          )}
        >
          <Gavel size={16} />
          <span>Terms of Service</span>
        </a>

        <a
          href="https://www.pup.edu.ph/privacy/"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm",
            "transition hover:bg-muted",
          )}
        >
          <ShieldCheck size={16} />
          <span>Privacy Policy</span>
        </a>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-xl",
          "bg-red-500/10 p-4 font-bold text-red-500 transition",
          "hover:bg-red-500/20",
        )}
      >
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
}
