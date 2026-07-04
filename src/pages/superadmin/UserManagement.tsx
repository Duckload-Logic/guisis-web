import { SearchInput } from "@/components/form";
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
  ArrowRight,
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

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<"users" | "whitelist">("users");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | undefined>();
  const [userToToggle, setUserToToggle] = useState<UserAccount | null>(null);
  const [userToManageRoles, setUserToManageRoles] =
    useState<UserAccount | null>(null);
  const [editingWhitelistEntry, setEditingWhitelistEntry] =
    useState<WhitelistEntry | null>(null);
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

  const filteredWhitelist =
    whitelistData?.filter((entry) => {
      const matchesSearch = entry.email
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole =
        roleFilter === undefined ||
        entry.roles.some((r) => r.id === roleFilter);
      return matchesSearch && matchesRole;
    }) || [];

  const toggleStatusMutation = useToggleUserStatus();
  const updateRolesMutation = useUpdateUserRoles();
  const addWhitelistMutation = useAddUserToWhitelist();
  const removeWhitelistMutation = useRemoveUserFromWhitelist();

  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [userToRemoveWhitelist, setUserToRemoveWhitelist] = useState<
    string | null
  >(null);

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
    description:
      "Manage, audit, and secure all user accounts across the platform.",
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

  const handleUpdateRoles = async (
    roleIds: number[],
    reason: string,
    referenceId: string,
  ) => {
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

  const userColumns = useMemo<Column<UserAccount>[]>(
    () => [
      {
        header: "User",
        className: "px-6 py-4",
        render: (user: UserAccount) => (
          <div className="flex items-center gap-3 text-left">
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
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground">
                {user.firstName} {user.lastName}{" "}
                {user.suffixName && <span> {user.suffixName}</span>}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs text-muted-foreground",
                )}
              >
                <Mail size={12} />
                {user.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Role",
        className: "px-6 py-4",
        render: (user: UserAccount) => (
          <div className="flex flex-wrap gap-1">
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
        header: "Status",
        className: "px-6 py-4",
        render: (user: UserAccount) => (
          <div className="flex items-center gap-1.5 font-bold tracking-tight">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                user.isActive ? "bg-emerald-500" : "bg-primary",
              )}
            />
            <span>{user.isActive ? "Active" : "Blocked"}</span>
          </div>
        ),
      },
      {
        header: "Joined Date",
        className: "px-6 py-4 text-muted-foreground",
        render: (user: UserAccount) => (
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(user.createdAt)}
          </div>
        ),
      },
      {
        header: "Actions",
        className: "px-6 py-4 text-left",
        render: (user: UserAccount) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-full hover:bg-muted",
                  "ml-auto hover:text-muted-foreground",
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
        ),
      },
    ],
    [navigate, userToManageRoles, userToToggle],
  );

  const whitelistColumns = useMemo<Column<WhitelistEntry>[]>(
    () => [
      {
        header: "Email Address",
        className: "px-6 py-4 font-medium text-foreground",
        render: (entry: WhitelistEntry) => (
          <div className="flex items-center gap-2">
            <Mail
              size={14}
              className="text-muted-foreground"
            />
            {entry.email}
          </div>
        ),
      },
      {
        header: "Pre-approved Roles",
        className: "px-6 py-4",
        render: (entry: WhitelistEntry) => (
          <div className="flex flex-wrap gap-1">
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
        header: "Date Whitelisted",
        className: "px-6 py-4 text-muted-foreground",
        render: (entry: WhitelistEntry) => (
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(entry.createdAt)}
          </div>
        ),
      },
      {
        header: "Actions",
        className: "px-6 py-4 text-right",
        render: (entry: WhitelistEntry) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-full hover:bg-muted",
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
        ),
      },
    ],
    [userToRemoveWhitelist, editingWhitelistEntry, isWhitelistOpen],
  );

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "border-b-2 px-6 py-2.5 text-sm font-semibold",
            "transition-all duration-200",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground " +
                  "hover:text-foreground",
          )}
        >
          Registered Users
        </button>
        <button
          onClick={() => setActiveTab("whitelist")}
          className={cn(
            "border-b-2 px-6 py-2.5 text-sm font-semibold",
            "transition-all duration-200",
            activeTab === "whitelist"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground " +
                  "hover:text-foreground",
          )}
        >
          Pending Whitelist
        </button>
      </div>

      {/* Search & Filters */}
      <div
        className={cn(
          "flex flex-col gap-4 lg:flex-row",
          "lg:items-center lg:justify-between",
        )}
      >
        <div
          className={cn(
            "flex flex-1 flex-col gap-3",
            "sm:flex-row sm:items-center",
          )}
        >
          <SearchInput
            hasHeader={false}
            placeholder="Search by name or email..."
            className="h-10 rounded-xl"
            searchTerm={search}
            onSearchChange={(e) => setSearch(e)}
          />

          <div
            className={cn(
              "flex items-center gap-2 rounded-xl",
              "border-glass-border bg-glass-bg p-2 shadow-md",
            )}
          >
            {[
              { roleId: undefined, label: "All Roles" },
              { roleId: 1, label: "Student" },
              { roleId: 2, label: "Admin" },
              { roleId: 3, label: "Superadmin" },
              { roleId: 4, label: "Developer" },
            ].map((role) => (
              <Button
                variant="outline"
                size="sm"
                key={role.label}
                onClick={() => setRoleFilter(role.roleId)}
                className={cn(
                  "h-10 rounded-xl border-none transition-all",
                  "duration-300 hover:text-foreground",
                  roleFilter === role.roleId
                    ? "bg-secondary text-secondary-foreground " +
                        "hover:bg-secondary hover:text-secondary-foreground"
                    : "hover:bg-white/10",
                )}
              >
                {role.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsWhitelistOpen(true)}
            className={cn(
              "h-10 rounded-xl bg-primary/75 text-primary-foreground",
              "flex items-center gap-2 hover:bg-primary",
            )}
          >
            <UserPlus size={16} />
            Whitelist Account
          </Button>
        </div>
      </div>

      {activeTab === "users" ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
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
                  className="rounded-lg border border-border bg-card text-muted-foreground"
                >
                  Total: {data?.meta?.total}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              data={data?.users || []}
              columns={userColumns}
              isLoading={isLoading}
              emptyState={
                <div className="py-20 text-center text-muted-foreground">
                  It's kind of lonely here.
                </div>
              }
              containerClassName="px-3 py-3"
            />
          </CardContent>

          {/* Pagination Section */}
          {data && data.meta.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield size={18} />
                </span>
                Pending Whitelist
              </CardTitle>
              <Badge
                variant="secondary"
                className="rounded-lg"
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
                <div className="py-20 text-center text-muted-foreground">
                  No pending whitelisted accounts found.
                </div>
              }
              containerClassName="px-3 py-3"
            />
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!userToToggle}
        onOpenChange={(open) => !open && setUserToToggle(null)}
      >
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
                userToToggle?.isActive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600",
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

      {/* Role Management Modal */}
      <RoleManagementModal
        user={userToManageRoles}
        isOpen={!!userToManageRoles}
        onClose={() => setUserToManageRoles(null)}
        onUpdate={handleUpdateRoles}
        isUpdating={updateRolesMutation.isPending}
      />

      {/* Whitelist Modal */}
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

      {/* Remove Whitelist Alert Dialog */}
      <AlertDialog
        open={!!userToRemoveWhitelist}
        onOpenChange={(open) => !open && setUserToRemoveWhitelist(null)}
      >
        <AlertDialogContent className="border-card bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{userToRemoveWhitelist}" from the
              registration whitelist?
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

