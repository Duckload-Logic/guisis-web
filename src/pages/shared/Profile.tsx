import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth, useToast } from "@/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Mail,
  User,
  Calendar,
  Settings,
  Lock,
  Activity,
  CheckCircle2,
  Clock,
  Key,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import {
  GetMyActivities,
  LogEntry,
} from "@/features/activity-meta/services/logService";
import { format12HourTime, formatDate } from "@/utils";
import { cn } from "@/lib/utils";
import { UploadProfilePicture } from "@/features/users/services/service";
import { getProfilePictureUrl } from "@/lib/profilePicture";

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const { triggerToast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activities, setActivities] = useState<LogEntry[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await GetMyActivities();
        setActivities(response.logs);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, []);

  const stats = useMemo(() => {
    if (!activities.length) return { logins: 0, reports: 0, lastSession: null };

    const loginLogs = activities.filter(
      (log) => log.action === "LOGIN_SUCCESS",
    );

    // Actions that count as "reports" or significant contributions
    const reportActions = [
      "APPOINTMENT_CREATED",
      "SLIP_CREATED",
      "NOTE_CREATED",
      "STUDENT_RECORD_CREATED",
    ];
    const reportLogs = activities.filter((log) =>
      reportActions.includes(log.action),
    );

    return {
      logins: loginLogs.length,
      reports: reportLogs.length,
      lastSession: loginLogs.length > 0 ? loginLogs[0].createdAt : null,
    };
  }, [activities]);

  const profileCompleteness = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.firstName,
      user.lastName,
      user.middleName,
      user.profilePicture,
      user.email,
      user.type,
    ];
    const filledFields = fields.filter((field) => !!field);
    return Math.round((filledFields.length / fields.length) * 100);
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      triggerToast("Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      triggerToast("Profile picture must be 10MB or smaller.");
      e.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);
    setIsUploadingPicture(true);

    try {
      const result = await UploadProfilePicture(file);
      setPreviewImage(getProfilePictureUrl(result.url) || localPreview);
      await refresh();
      triggerToast("Profile picture updated successfully.");
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      setPreviewImage(getProfilePictureUrl(user?.profilePicture) || null);
      triggerToast("Unable to upload profile picture. Please try again.");
    } finally {
      setIsUploadingPicture(false);
      e.target.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) return null;

  usePageMetadata(
    useMemo(
      () => ({
        title: "Account Profile",
        isLoading: false,
        badgeText: "Management",
        badgeIcon: <Settings size={16} />,
      }),
      [user],
    ),
  );

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 mx-auto flex",
        "w-full max-w-[1700px] flex-col space-y-8 pb-12 duration-700",
      )}
    >
      {/* Profile Header / Hero Section */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-[32px] border",
          "border-glass-border bg-glass-bg p-8 shadow-md",
          "transition-all duration-500 hover:shadow-primary/5",
          "md:p-12",
        )}
      >
        <div className="relative flex flex-col items-center gap-10 md:flex-row md:items-start">
          {/* Avatar Section with Impact */}
          <div className="group/avatar relative shrink-0">
            <div
              className={cn(
                "relative h-40 w-40 rounded-full bg-primary",
                "p-1.5 shadow-2xl",
              )}
            >
              <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-black/40 blur-sm" />
              <Avatar className="relative z-10 h-full w-full rounded-full border-4 border-card">
                {/* <AvatarImage
                  src={
                    previewImage || getProfilePictureUrl(user?.profilePicture)
                  }
                  className="object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                /> */}
                <AvatarFallback className="bg-muted text-4xl font-bold uppercase text-muted-foreground">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* <button
              onClick={triggerFileInput}
              className={cn(
                "absolute bottom-2 right-2 z-20 transform rounded-full",
                "bg-primary p-3.5 text-primary-foreground shadow-2xl",
                "transition-all duration-300 hover:rotate-12 hover:scale-110",
                "active:scale-95",
              )}
              title={
                isUploadingPicture ? "Uploading..." : "Change profile picture"
              }
              disabled={isUploadingPicture}
            >
              <Camera size={20} />
            </button> */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
            />
          </div>

          {/* User Essential Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full border-primary/10 bg-primary/10 px-3 py-1",
                    "text-primary backdrop-blur-md",
                  )}
                >
                  {user.type.toUpperCase()} ACCOUNT
                </Badge>
                {user.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="secondary"
                    className={cn(
                      "rounded-full bg-muted/60 px-3 py-1 text-[10px] font-semibold",
                      "uppercase text-foreground",
                    )}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
              <h1
                className={cn(
                  "bg-gradient-to-r from-foreground to-foreground/60",
                  "bg-clip-text text-lg tracking-tight",
                  "text-foreground md:text-5xl",
                )}
              >
                {user.firstName} {user.middleName && `${user.middleName[0]}. `}{" "}
                {user.lastName}
              </h1>
              <p className="text-xl font-medium text-muted-foreground/80">
                {user.email}
              </p>
            </div>

            <div
              className={cn(
                "mt-4 flex flex-wrap items-center justify-center gap-6",
                "border-t border-border/20 pt-6 md:justify-start",
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground/60">
                  Last Login
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <Clock
                    size={12}
                    className="text-blue-400"
                  />{" "}
                  {stats.lastSession
                    ? `${format12HourTime(stats.lastSession)} Today`
                    : "No recent session"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Tabs Interface */}
      <Tabs
        defaultValue="overview"
        className="space-y-6"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <TabsList
            className={cn(
              "h-auto self-start rounded-2xl border border-glass-border bg-glass-bg",
              "p-1 shadow-md backdrop-blur-md",
            )}
          >
            {[
              {
                value: "overview",
                label: "Overview",
                icon: <User size={16} />,
              },
              {
                value: "activity",
                label: "Activity",
                icon: <Activity size={16} />,
              },
            ].map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  "flex gap-2 rounded-xl px-6 py-2.5 transition-all",
                  "data-[state=active]:bg-primary",
                  "data-[state=active]:text-primary-foreground",
                  "data-[state=active]:shadow-lg",
                )}
              >
                {item.icon}
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab Content */}
        <TabsContent
          value="overview"
          className="grid grid-cols-1 gap-6 outline-none md:grid-cols-3"
        >
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border-glass-border bg-glass-bg",
              "shadow-md backdrop-blur-xl",
              "transition-colors",
              "md:col-span-2",
            )}
          >
            <CardHeader className="border-b border-glass-border bg-glass-bg p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                    <User
                      className="text-primary"
                      size={24}
                    />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Primary account details that identify you in the system.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "group cursor-not-allowed rounded-full border-primary/20",
                    "bg-muted/50 text-primary",
                  )}
                >
                  <Lock
                    size={14}
                    className="mr-2 group-hover:animate-bounce"
                  />{" "}
                  Uneditable
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
                <div className="group space-y-2">
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.2em]",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    First Name
                  </p>
                  <div
                    className={cn(
                      "flex h-10 items-center rounded-xl border border-border/10",
                      "bg-muted/40 px-4 text-sm font-bold",
                    )}
                  >
                    {user.firstName}
                  </div>
                </div>
                {user.middleName && (
                  <div className="group space-y-2">
                    <p
                      className={cn(
                        "text-[10px] uppercase tracking-[0.2em]",
                        "text-muted-foreground/60 transition-colors",
                        "group-hover:text-primary",
                      )}
                    >
                      Middle Name
                    </p>
                    <div
                      className={cn(
                        "flex h-10 items-center rounded-xl border border-border/10",
                        "bg-muted/40 px-4 text-sm font-bold italic",
                        "text-muted-foreground",
                      )}
                    >
                      {user.middleName}
                    </div>
                  </div>
                )}
                <div className="group space-y-2">
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.2em]",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Last Name
                  </p>
                  <div
                    className={cn(
                      "flex h-10 items-center rounded-xl border border-border/10",
                      "bg-muted/40 px-4 text-sm font-bold",
                    )}
                  >
                    {user.lastName}
                  </div>
                </div>
                <div className="group space-y-2">
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.2em]",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Primary Email
                  </p>
                  <div
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-xl border",
                      "border-border/10 bg-muted/40 px-4 text-sm font-bold",
                    )}
                  >
                    <Mail
                      size={16}
                      className="text-blue-500"
                    />
                    {user.email}
                  </div>
                </div>
                <div className="group space-y-2 sm:col-span-2">
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.2em]",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Contact Number
                  </p>
                  <div
                    className={cn(
                      "flex h-10 items-center rounded-xl border border-border/10",
                      "bg-muted/40 px-4 text-sm font-bold italic",
                      "text-muted-foreground/50",
                    )}
                  >
                    Not provided
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "self-start overflow-hidden rounded-2xl border-glass-border bg-glass-bg",
              "shadow-md backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-glass-border p-8">
              <CardTitle className="text-lg font-bold">Quick Stats</CardTitle>
              <CardDescription>Engagement and account metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/10 bg-muted/30 p-4 text-center">
                  <p className="mb-1 text-[10px] font-bold text-muted-foreground/60">
                    LOGINS
                  </p>
                  <p className="text-xl">{stats.logins}</p>
                </div>
                <div
                  className={cn(
                    "col-span-2 rounded-2xl border border-primary/20 bg-gradient-to-br",
                    "from-primary/10 to-blue-500/10 p-6 shadow-inner",
                  )}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Calendar
                      size={16}
                      className="text-primary"
                    />
                    <p className="text-xs font-bold">Join Date</p>
                  </div>
                  <p className="text-xl tracking-tight">
                    {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab Content */}
        <TabsContent
          value="activity"
          className="outline-none"
        >
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border-glass-border bg-glass-bg",
              "shadow-md backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-glass-border p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Activity size={28} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Activity Dashboard
                    </CardTitle>
                    <CardDescription>
                      Track your interactions and system events.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {isLoadingActivities ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-24">
                  <div
                    className={cn(
                      "h-10 w-10 animate-spin rounded-full border-4 border-primary",
                      "border-t-transparent",
                    )}
                  />
                  <p className="font-medium text-muted-foreground">
                    Loading your activities...
                  </p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "group flex gap-4 rounded-2xl border border-border/10",
                        "bg-muted/20 p-4 transition-all hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2 ${
                          log.category === "SECURITY"
                            ? "bg-blue-500/10 text-blue-500"
                            : log.category === "AUDIT"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {log.action.includes("LOGIN") ? (
                          <Key size={20} />
                        ) : log.action.includes("CREATED") ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Activity size={20} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-bold">
                            {log.action.replace(/_/g, " ")}
                          </h6>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length > 10 && (
                    <p className="pt-4 text-center text-[10px] italic text-muted-foreground">
                      Showing last 10 activities.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-xs space-y-6 py-24 text-center">
                  <div
                    className={cn(
                      "mx-auto mb-6 flex h-20 w-20 items-center justify-center",
                      "rounded-full border-4 border-card bg-muted shadow-inner",
                    )}
                  >
                    <Clock
                      size={32}
                      className="text-muted-foreground/40"
                    />
                  </div>
                  <h3 className="text-xl font-bold">No recent activities</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your recent activities, login history, and system logs will
                    appear here as you interact with the platform.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
