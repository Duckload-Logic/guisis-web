import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  MoreHorizontal,
  Settings,
  LogOut,
  ShieldCheck,
  Gavel,
  Pin,
  PinOff,
} from "lucide-react";


import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useUI, useAuth } from "@/context";
import { UISettingsModal } from "@/components/shared/UISettingsModal";
import { cn } from "@/lib/utils";

const HOME_HREF = "/";
const SETTINGS_HREF = "/settings";

function NavItem({
  item,
  active,
  variant = "desktop",
  isExpanded = false,
  onClick,
}: {
  item: { label: string; href: string; icon: React.ReactNode };
  active: boolean;
  variant?: "desktop" | "mobile-bottom" | "mobile-drawer";
  isExpanded?: boolean;
  onClick?: () => void;
}) {
  if (variant === "mobile-bottom") {
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`group flex flex-col items-center p-2 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center",
            "transition-transform group-hover:scale-110",
          )}
        >
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

  // Desktop variant
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`sidebar-icon-tilt group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:shadow-sm ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <div
        className={`flex w-6 shrink-0 items-center justify-center transition-transform duration-200 ${isExpanded ? "scale-110" : ""}`}
      >
        {item.icon}
      </div>

      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isExpanded ? "w-auto translate-x-0 opacity-100" : "w-0 translate-x-[-3px] opacity-0"}`}
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
    toggleSidebarPinned,
    sidebarHovered,
    setSidebarHovered,
  } = useUI();
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();

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

  const isExpanded = sidebarPinned || sidebarHovered;
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

  const debouncedSetHovered = useDebouncedCallback((value: boolean) => {
    setSidebarHovered(value);
  }, 150);

  const handleMouseEnter = () => {
    debouncedSetHovered(true);
  };

  const handleMouseLeave = () => {
    debouncedSetHovered(false);
  };

  if (isMobile) {
    const homeItem = navigationItems.find((i) => i.href === HOME_HREF);
    const overflowItems = navigationItems.filter(
      (i) => i.href !== HOME_HREF && i.href !== SETTINGS_HREF,
    );

    const isOverflowActive = overflowItems.some((item) =>
      location.pathname.startsWith(item.href),
    );

    return (
      <>
        <nav className="fixt bottom-0 z-50 w-full shrink-0 border-t bg-background">
          <div className="flex h-16 items-center justify-around px-2">
            {homeItem && (
              <NavItem
                item={homeItem}
                active={isActive(homeItem)}
                variant="mobile-bottom"
              />
            )}

            <button
              onClick={() => {
                setDrawerMode("menu");
                setOpenDrawer(true);
              }}
              className={`group flex flex-col items-center p-2 ${
                isOverflowActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MoreHorizontal className="h-6 w-6 transition-transform group-aria-pressed:animate-spin" />
            </button>
            <button
              onClick={() => {
                setDrawerMode("settings");
                setOpenDrawer(true);
              }}
              className={`group flex flex-col items-center p-2 ${
                location.pathname.includes(SETTINGS_HREF)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Settings className="h-6 w-6 transition-transform group-hover:rotate-45" />
            </button>
          </div>
        </nav>

        <Drawer
          open={openDrawer}
          onOpenChange={setOpenDrawer}
        >
          <DrawerContent className="space-y-8 p-4 pb-8">
            {drawerMode === "menu" ? (
              <div className="space-y-3">
                <p className="px-2 text-xs font-bold text-muted-foreground">
                  NAVIGATION
                </p>
                {overflowItems.map((item) => {
                  return (
                    <NavItem
                      key={item.href}
                      item={item}
                      active={isActive(item)}
                      variant="mobile-drawer"
                      onClick={() => setOpenDrawer(false)}
                    />
                  );
                })}
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

  return (
    <div
      className={`relative z-[90] hidden h-full shrink-0 items-center transition-all duration-300 md:flex ${sidebarPinned ? "w-[16.25rem]" : "w-[4.5rem]"}`}
    >
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative z-30 flex h-[95%] flex-col overflow-x-hidden rounded-3xl rounded-bl-none rounded-tl-none border border-l-0 border-glass-border shadow-lg transition-all duration-300 ${isExpanded ? "w-64" : "w-[4.5rem]"}`}
      >
        <nav className="mt-2 flex flex-col gap-2 p-3">
          {navigationItems.map((item) => {
            return (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item)}
                isExpanded={isExpanded}
                variant="desktop"
              />
            );
          })}
        </nav>

        {/* Role Switcher (Desktop) */}
        {/* {user?.roles?.length > 1 && (
          <div className="mb-2 mt-auto p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "sidebar-icon-tilt group flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:shadow-sm",
                    "border border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary/20",
                  )}
                  title="Switch Workspace"
                >
                  <div className="flex w-6 shrink-0 items-center justify-center">
                    <RefreshCw
                      className={cn(
                        "h-5 w-5",
                        isExpanded && "animate-spin-once",
                      )}
                    />
                  </div>
                  {isExpanded && (
                    <span className="flex-1 overflow-hidden whitespace-nowrap text-left text-xs font-bold uppercase">
                      Switch Role
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isExpanded ? "bottom" : "right"}
                align="start"
                className="w-56 rounded-2xl border-white/20 bg-white/80 backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/90"
              >
                <p className="px-3 py-2 text-[10px] uppercase text-muted-foreground/60">
                  Your Workspaces
                </p>
                <DropdownMenuSeparator className="bg-white/10" />
                {user.roles.map((r: any) => {
                  const isActiveRole = r.id === activeRole?.id;
                  return (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => handleRoleSwitch(r)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus:bg-primary/10",
                        isActiveRole && "bg-primary/5 font-bold text-primary",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50",
                          isActiveRole && "bg-primary/20",
                        )}
                      >
                        <LayoutDashboard size={16} />
                      </div>
                      <span className="text-sm">{r.name}</span>
                      {isActiveRole && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )} */}

        {/* Pin Toggle (Desktop Only) - Balanced spacing */}
        <div className={cn("mb-2 mt-auto p-3")}>
          <button
            onClick={toggleSidebarPinned}
            className={`sidebar-icon-tilt group flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:shadow-sm ${
              sidebarPinned
                ? "bg-primary/10 text-primary shadow-lg"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
            title={sidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            <div className="flex w-6 shrink-0 items-center justify-center">
              {sidebarPinned ? (
                <PinOff size="1.25rem" />
              ) : (
                <Pin size="1.25rem" />
              )}
            </div>
            {isExpanded && (
              <span
                className={cn(
                  "animate-in fade-in slide-in-from-left-2 w-auto",
                  "overflow-hidden whitespace-nowrap font-medium duration-200",
                )}
              >
                {sidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
              </span>
            )}
          </button>
        </div>
      </aside>
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
      {/* Profile Section */}
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

      {/* Mobile Role Switcher */}
      {/* {user?.roles?.length > 1 && (
        <div className="space-y-3">
          <p className="px-2 text-[10px] uppercase text-muted-foreground/60">
            Switch Workspace
          </p>
          <div className="grid grid-cols-1 gap-2">
            {user.roles.map((r: any) => {
              const isActiveRole = r.id === activeRole?.id;
              return (
                <button
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
      )} */}

      <div className="my-2 border-t border-border" />
      <div className="flex flex-col gap-2">
        <button
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
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm",
            "transition hover:bg-muted",
          )}
        >
          <ShieldCheck size={16} />
          <span>Privacy Policy</span>
        </a>
      </div>

      {/* Logout Action */}
      <button
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
