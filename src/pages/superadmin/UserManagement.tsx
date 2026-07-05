import { SearchInput, Dropdown } from "@/components/form";
import { Pagination, Table, Column } from "@/components/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePageMetadata, useToast } from "@/context";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  Mail,
  MoreVertical,
  Shield,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Inbox,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAddUserToWhitelist,
  useRemoveUserFromWhitelist,
  useToggleUserStatus,
  useUpdateUserRoles,
  useUsers,
  useWhitelist,
} from "@/features/system-admin/hooks";
import type {
  UserAccount,
  WhitelistEntry,
} from "@/features/system-admin/types";
import { RoleManagementModal } from "./RoleManagementModal";
import { WhitelistModal } from "./WhitelistModal";
import { useDebounce } from "@/hooks/useDebounce";

type SortOrder = "asc" | "desc";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<"users" | "whitelist">("users");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const [roleFilter, setRoleFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("userName");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("asc");

  const [userToToggle, setUserToToggle] = useState<UserAccount | null>(null);
  const [userToManageRoles, setUserToManageRoles] = useState<UserAccount | null>(null);
  const [editingWhitelistEntry, setEditingWhitelistEntry] = useState<WhitelistEntry | null>(null);
  
  const debounceSearch = useDebounce(search, 500);
  const navigate = useNavigate();
  const { triggerToast } = useToast();

  const { data, isLoading } = useUsers({
    page,
    page_size: 10,
    search: debounceSearch,
    role_id: roleFilter,
  });

  const { data: whitelistData, isLoading: isWhitelistLoading } = useWhitelist();

  const toggleStatusMutation = useToggleUserStatus();
  const updateRolesMutation = useUpdateUserRoles();
  const addWhitelistMutation = useAddUserToWhitelist();
  const removeWhitelistMutation = useRemoveUserFromWhitelist();

  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [userToRemoveWhitelist, setUserToRemoveWhitelist] = useState<string | null>(null);

  const processedUsers = useMemo(() => {
    let result = [...(data?.users || [])];

    if (statusFilter === "active") result = result.filter(u => u.isActive);
    if (statusFilter === "blocked") result = result.filter(u => !u.isActive);

    result.sort((a, b) => {
      if (selectedSort === "userName") {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        const res = nameA.localeCompare(nameB);
        return selectedOrder === "asc" ? res : -res;
      }
      if (selectedSort === "joinedDate") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [data?.users, statusFilter, selectedSort, selectedOrder]);

  const filteredWhitelist = useMemo(() => {
    return (whitelistData || []).filter((entry) => {
      const matchesSearch = entry.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === undefined || entry.roles.some((r) => r.id === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [whitelistData, search, roleFilter]);

  const roleOptions = [
    { id: "all", displayName: "All Roles" },
    { id: 1, displayName: "Student" },
    { id: 2, displayName: "Admin" },
    { id: 3, displayName: "Superadmin" },
    { id: 4, displayName: "Developer" },
  ];

  const statusOptions = [
    { id: "all", displayName: "All Statuses" },
    { id: "active", displayName: "Active" },
    { id: "blocked", displayName: "Blocked" },
  ];

  const handleWhitelist = async (email: string, roleIds: number[]) => {
    try {
      await addWhitelistMutation.mutateAsync({ email, roleIds });
      triggerToast(
        editingWhitelistEntry
          ? "Whitelist roles updated successfully"
          : "Email added to whitelist successfully",
      );
      setIsWhitelistOpen(false);
      setEditingWhitelistEntry(null);
    } catch (err: any) {
      triggerToast(getErrorMessage(err));
    }
  };

  const handleRemoveFromWhitelist = async () => {
    if (!userToRemoveWhitelist) return;
    try {
      await removeWhitelistMutation.mutateAsync(userToRemoveWhitelist);
      triggerToast("Email removed from whitelist successfully");
      setUserToRemoveWhitelist(null);
    } catch (err: any) {
      triggerToast(getErrorMessage(err));
    }
  };

  usePageMetadata({
    title: "User Management",
    badgeText: "System-wide Accounts",
    badgeIcon: <Users className="h-3 w-3" />,
    description: "Manage, audit, and secure all user accounts across the platform.",
  });

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    const action = userToToggle.isActive ? "block" : "unblock";
    try {
      await toggleStatusMutation.mutateAsync({ id: userToToggle.id, action });
      triggerToast(`User successfully ${action}ed`);
      setUserToToggle(null);
    } catch (err: any) {
      triggerToast(getErrorMessage(err));
    }
  };

  const handleUpdateRoles = async (roleIds: number[], reason: string, referenceId: string) => {
    if (!userToManageRoles) return;
    try {
      await updateRolesMutation.mutateAsync({
        userId: userToManageRoles.id,
        roleIds,
        reason,
        referenceId,
      });
      triggerToast("User roles updated successfully");
      setUserToManageRoles(null);
    } catch (err: any) {
      triggerToast(getErrorMessage(err));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };


  const getInitials = (user: UserAccount) => {
    const first = user.firstName?.trim()?.[0] || "";
    const last = user.lastName?.trim()?.[0] || "";
    const fallback = user.email?.trim()?.[0] || "U";

    return `${first}${last}`.trim().toUpperCase() || fallback.toUpperCase();
  };

  const getUserProfilePicture = (user: UserAccount) =>
    getProfilePictureUrl(user.profilePicture);

  const hideBrokenProfilePicture = (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    event.currentTarget.classList.add("hidden");
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "superadmin":
        return "bg-primary/10 text-primary border-primary/20";
      case "admin":
      case "counselor":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "student":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const menuActions = (user: UserAccount) => [
    {
      id: "activity",
      label: "View Activity",
      icon: ArrowRight,
      onAction: () => navigate(`/superadmin/users/${user.id}/activity`),
    },
    {
      id: "sessions",
      label: "Audit Sessions",
      icon: ShieldAlert,
      onAction: () => navigate(`/superadmin/users/${user.id}/sessions`),
    },
    {
      id: "roles",
      label: "Manage Roles",
      icon: Shield,
      onAction: () => setUserToManageRoles(user),
    },
    {
      id: "status",
      label: user.isActive ? "Block Account" : "Unlock Account",
      icon: user.isActive ? UserX : UserCheck,
      onAction: () => setUserToToggle(user),
    },
  ];

  const renderSortableHeader = (label: string, sortKey: string) => {
    const isActive = selectedSort === sortKey;
    const Icon = isActive ? (selectedOrder === "desc" ? ArrowDown : ArrowUp) : ArrowUp;

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedSort(sortKey);
          setSelectedOrder(isActive && selectedOrder === "asc" ? "desc" : "asc");
          setPage(1);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2 py-1 whitespace-nowrap outline-none",
          "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
          isActive ? "text-[#800000]" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon 
          className={cn("h-3.5 w-3.5 shrink-0", isActive ? "opacity-100" : "opacity-40")} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      </button>
    );
  };

  const userColumns = useMemo<Column<UserAccount>[]>(
    () => [
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("User", "userName")}
          </div>
        ),
        className: "w-[30%] p-0",
        render: (user: UserAccount) => (
          <div className="px-3 py-3 flex items-center gap-3 text-left">
            <div
              className={cn(
                "relative flex aspect-square h-10 w-10 shrink-0 items-center justify-center overflow-hidden",
                "rounded-xl border border-primary/15 bg-primary/10 text-xs font-bold",
                "uppercase text-primary shadow-sm",
              )}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {getInitials(user)}
              </span>
              {getUserProfilePicture(user) && (
                <img
                  src={getUserProfilePicture(user)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="relative z-10 h-full w-full object-cover"
                  onError={hideBrokenProfilePicture}
                />
              )}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-semibold text-foreground truncate">
                {user.firstName} {user.lastName}{" "}
                {user.suffixName && <span> {user.suffixName}</span>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        ),
        },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <Dropdown
              label=""
              options={roleOptions}
              value={roleFilter === undefined ? "all" : roleFilter}
              onChange={(val) => {
                setRoleFilter(val === "all" ? undefined : Number(val));
                setPage(1);
              }}
              labelKey="displayName"
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                roleFilter === undefined ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
              )}
            />
          </div>
        ),
        className: "w-[25%] p-0",
        render: (user: UserAccount) => (
          <div className="px-3 py-3 flex flex-wrap gap-1">
            {user.roles.map((role: any) => (
              <Badge
                key={role.id}
                variant="outline"
                className={cn(
                  "rounded-full px-3 font-medium transition-all",
                  getRoleBadgeColor(role.name),
                )}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <Dropdown
              label=""
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => {
                const v = String(val);
                setStatusFilter(!val || v === "undefined" ? "all" : v);
                setPage(1);
              }}
              labelKey="displayName"
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                statusFilter === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
              )}
            />
          </div>
        ),
        className: "w-[15%] p-0",
        render: (user: UserAccount) => (
          <div className="px-3 py-3 flex items-center gap-1.5 font-bold tracking-tight">
            <div
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                user.isActive ? "bg-emerald-500" : "bg-primary",
              )}
            />
            <span className="text-sm">{user.isActive ? "Active" : "Blocked"}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Joined Date", "joinedDate")}
          </div>
        ),
        className: "w-[20%] p-0",
        render: (user: UserAccount) => (
          <div className="px-3 py-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{formatDate(user.createdAt)}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-end">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pr-2">
              Actions
            </span>
          </div>
        ),
        className: "w-[10%] p-0",
        render: (user: UserAccount) => (
          <div className="px-3 py-3 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full hover:bg-muted",
                    "hover:text-muted-foreground",
                  )}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl bg-card backdrop-blur-2xl"
              >
                {menuActions(user).map((item: any) => (
                  <DropdownMenuItem
                    key={item.id}
                    className={cn(
                      "cursor-pointer gap-2 text-foreground",
                      "focus:bg-muted focus:text-primary",
                    )}
                    onClick={item.onAction}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [navigate, userToManageRoles, userToToggle, roleFilter, statusFilter, selectedSort, selectedOrder],
  );

  const whitelistColumns = useMemo<Column<WhitelistEntry>[]>(
    () => [
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start pl-4">
             <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
               Email Address
             </span>
          </div>
        ),
        className: "w-[35%] p-0",
        render: (entry: WhitelistEntry) => (
          <div className="px-3 py-3 flex items-center gap-2 pl-4 font-medium text-foreground">
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">{entry.email}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <Dropdown
              label=""
              options={roleOptions}
              value={roleFilter === undefined ? "all" : roleFilter}
              onChange={(val) => setRoleFilter(val === "all" ? undefined : Number(val))}
              labelKey="displayName"
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                roleFilter === undefined ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
              )}
            />
          </div>
        ),
        className: "w-[30%] p-0",
        render: (entry: WhitelistEntry) => (
          <div className="px-3 py-3 flex flex-wrap gap-1">
            {entry.roles.map((role: any) => (
              <Badge
                key={role.id}
                variant="outline"
                className={cn(
                  "rounded-full px-3 font-medium transition-all",
                  getRoleBadgeColor(role.name),
                )}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
             <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
               Date Whitelisted
             </span>
          </div>
        ),
        className: "w-[25%] p-0",
        render: (entry: WhitelistEntry) => (
          <div className="px-3 py-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{formatDate(entry.createdAt)}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-end">
             <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pr-2">
               Actions
             </span>
          </div>
        ),
        className: "w-[10%] p-0",
        render: (entry: WhitelistEntry) => (
          <div className="px-3 py-3 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full hover:bg-muted",
                    "hover:text-muted-foreground",
                  )}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl bg-card backdrop-blur-2xl"
              >
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer gap-2 text-foreground",
                    "focus:bg-muted focus:text-primary",
                  )}
                  onClick={() => {
                    setEditingWhitelistEntry(entry);
                    setIsWhitelistOpen(true);
                  }}
                >
                  <Shield size={14} />
                  Edit Roles
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer gap-2 text-red-500",
                    "hover:text-red-500 focus:bg-red-500/10",
                    "focus:text-red-500",
                  )}
                  onClick={() => setUserToRemoveWhitelist(entry.email)}
                >
                  <UserMinus size={14} />
                  Remove Whitelist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [userToRemoveWhitelist, editingWhitelistEntry, isWhitelistOpen, roleFilter],
  );

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-white/10 pb-1">
        <button
          onClick={() => {
            setActiveTab("users");
            setPage(1);
          }}
          className={cn(
            "border-b-2 px-6 py-2.5 text-sm font-semibold",
            "transition-all duration-200",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Registered Users
        </button>
        <button
          onClick={() => {
            setActiveTab("whitelist");
            setPage(1);
          }}
          className={cn(
            "border-b-2 px-6 py-2.5 text-sm font-semibold",
            "transition-all duration-200",
            activeTab === "whitelist"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Pending Whitelist
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <SearchInput
            hasHeader={false}
            placeholder="Search by name or email..."
            className="h-10 rounded-xl"
            searchTerm={search}
            onSearchChange={(e) => {
              setSearch(e);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center shrink-0">
          <Button
            onClick={() => setIsWhitelistOpen(true)}
            className={cn(
              "h-10 rounded-xl bg-primary/75 text-primary-foreground",
              "flex items-center gap-2 hover:bg-primary shadow-sm",
            )}
          >
            <UserPlus size={16} />
            Whitelist Account
          </Button>
        </div>
      </div>

      {activeTab === "users" ? (
        <Card className="overflow-hidden border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40 rounded-2xl">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield size={18} />
                </span>
                User Accounts
              </CardTitle>
              {data && (
                <Badge
                  variant="outline"
                  className="rounded-xl border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground shadow-sm"
                >
                  Total: {data?.meta?.total}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table
              data={processedUsers}
              columns={userColumns}
              isLoading={isLoading}
              emptyState={
                <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
                  <Inbox className="h-10 w-10 mb-3 opacity-50" />
                  <p>No user accounts found matching your filters.</p>
                  {(roleFilter !== undefined || statusFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setRoleFilter(undefined); setStatusFilter("all"); }} 
                      className="mt-4 rounded-xl shadow-md"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              }
              containerClassName="overflow-x-auto" 
              tableClassName="w-full table-fixed min-w-[800px]"
            />
          </CardContent>

          {data && data.meta.totalPages > 1 && (
            <div className="border-t border-border/50 bg-slate-50/50 dark:bg-transparent">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40 rounded-2xl">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield size={18} />
                </span>
                Pending Whitelist
              </CardTitle>
              <Badge
                variant="outline"
                className="rounded-xl border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground shadow-sm"
              >
                Total: {filteredWhitelist.length}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table
              data={filteredWhitelist}
              columns={whitelistColumns}
              isLoading={isWhitelistLoading}
              emptyState={
                <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
                  <Inbox className="h-10 w-10 mb-3 opacity-50" />
                  <p>No pending whitelisted accounts found.</p>
                  {roleFilter !== undefined && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setRoleFilter(undefined)} 
                      className="mt-4 rounded-xl shadow-md"
                    >
                      Clear Role Filter
                    </Button>
                  )}
                </div>
              }
              containerClassName="px-0 py-0"
              tableClassName="w-full table-fixed"
            />
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
        <AlertDialogContent className="border-card bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isActive ? "Block" : "Unlock"} User Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.isActive
                ? `Blocking "${userToToggle.firstName} ${userToToggle.lastName}" will prevent them from accessing any platform features immediately.`
                : `Unlocking "${userToToggle?.firstName} ${userToToggle?.lastName}" will restore their full access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={cn(
                "rounded-xl text-white",
                userToToggle?.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600",
              )}
            >
              {toggleStatusMutation.isPending
                ? "Processing..."
                : userToToggle?.isActive
                  ? "Block Account"
                  : "Unlock Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleManagementModal
        user={userToManageRoles}
        isOpen={!!userToManageRoles}
        onClose={() => setUserToManageRoles(null)}
        onUpdate={handleUpdateRoles}
        isUpdating={updateRolesMutation.isPending}
      />

      <WhitelistModal
        isOpen={isWhitelistOpen}
        onClose={() => {
          setIsWhitelistOpen(false);
          setEditingWhitelistEntry(null);
        }}
        onWhitelist={handleWhitelist}
        isProcessing={addWhitelistMutation.isPending}
        initialEmail={editingWhitelistEntry?.email}
        initialRoleIds={editingWhitelistEntry?.roles.map((r) => r.id)}
      />

      <AlertDialog open={!!userToRemoveWhitelist} onOpenChange={(open) => !open && setUserToRemoveWhitelist(null)}>
        <AlertDialogContent className="border-card bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{userToRemoveWhitelist}" from the registration whitelist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromWhitelist}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {removeWhitelistMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}