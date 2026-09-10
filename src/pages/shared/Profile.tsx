import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
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
  ZoomOut,
  Loader2,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import {
  GetMyActivities,
  LogEntry,
} from "@/features/activity-meta/services/logService";
import { format12HourTime, formatDate } from "@/utils";
import { cn } from "@/lib/utils";
import {
  UploadProfilePicture,
  GetUserById,
} from "@/features/users/services/service";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import { superadminService } from "@/features/system-admin/services";
import { useQuery } from "@tanstack/react-query";

const CROP_BOX_SIZE = 256;
const OUTPUT_DIMENSION = 512;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Profile() {
  const { user: authUser, refresh } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const { triggerToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activities, setActivities] = useState<LogEntry[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Modal crop & adjust state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
  }>({ startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });

  // Fetch target user if userId is provided
  const { data: targetUser, isLoading: isLoadingTarget } = useQuery({
    queryKey: ["superadmin", "users", "detail", userId],
    queryFn: () => GetUserById(userId!),
    enabled: !!userId,
  });

  const user = useMemo(() => {
    if (userId) {
      return targetUser || null;
    }
    return authUser;
  }, [userId, authUser, targetUser]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        let logs: any[] = [];
        if (userId) {
          const response = await superadminService.getUserActivity(userId);
          logs = response.logs;
        } else {
          const response = await GetMyActivities();
          logs = response.logs;
        }
        setActivities(logs);
      } catch (error) {
        console.error(
          "[Profile] {fetchActivities}: failed to fetch activities",
          error,
        );
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [userId]);

  const stats = useMemo(() => {
    if (!activities.length) {
      return { logins: 0, reports: 0, lastSession: null };
    }

    const loginLogs = activities.filter(
      (log) => log.action === "LOGIN_SUCCESS",
    );

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

  const userType = useMemo(() => {
    if (!user) return "";
    if ("type" in user && user.type) return user.type;
    const roleName = user.roles?.[0]?.name?.toLowerCase() || "";
    return roleName;
  }, [user]);

  // Image cropping maths
  const baseScale = useMemo(() => {
    if (!naturalDimensions.width || !naturalDimensions.height) return 1;
    return Math.max(
      CROP_BOX_SIZE / naturalDimensions.width,
      CROP_BOX_SIZE / naturalDimensions.height,
    );
  }, [naturalDimensions]);

  const displayWidth = naturalDimensions.width * baseScale * zoom;
  const displayHeight = naturalDimensions.height * baseScale * zoom;

  const maxPanX = Math.max(0, (displayWidth - CROP_BOX_SIZE) / 2);
  const maxPanY = Math.max(0, (displayHeight - CROP_BOX_SIZE) / 2);

  const clampPan = useCallback(
    (nextX: number, nextY: number) => {
      const clampedX = Math.min(maxPanX, Math.max(-maxPanX, nextX));
      const clampedY = Math.min(maxPanY, Math.max(-maxPanY, nextY));
      return { x: clampedX, y: clampedY };
    },
    [maxPanX, maxPanY],
  );

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom);
    const nextDispW = naturalDimensions.width * baseScale * nextZoom;
    const nextDispH = naturalDimensions.height * baseScale * nextZoom;
    const nextMaxX = Math.max(0, (nextDispW - CROP_BOX_SIZE) / 2);
    const nextMaxY = Math.max(0, (nextDispH - CROP_BOX_SIZE) / 2);
    setPan((prev) => ({
      x: Math.min(nextMaxX, Math.max(-nextMaxX, prev.x)),
      y: Math.min(nextMaxY, Math.max(-nextMaxY, prev.y)),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPan(
        clampPan(
          dragStartRef.current.initialPanX + dx,
          dragStartRef.current.initialPanY + dy,
        ),
      );
    },
    [isDragging, clampPan],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    setPan(
      clampPan(
        dragStartRef.current.initialPanX + dx,
        dragStartRef.current.initialPanY + dy,
      ),
    );
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const cleanupCrop = useCallback(() => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setSelectedFile(null);
    setCropModalOpen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNaturalDimensions({ width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [cropImageSrc]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      triggerToast("Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      triggerToast("Profile picture must be 10MB or smaller.");
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setSelectedFile(file);
      setCropImageSrc(objectUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      triggerToast("Unable to load the selected image file.");
      e.target.value = "";
    };
    img.src = objectUrl;
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !selectedFile) return;

    setIsUploadingPicture(true);
    try {
      const img = new Image();
      img.src = cropImageSrc;
      await new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = reject;
        }
      });

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_DIMENSION;
      canvas.height = OUTPUT_DIMENSION;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create canvas context");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_DIMENSION, OUTPUT_DIMENSION);

      const ratio = OUTPUT_DIMENSION / CROP_BOX_SIZE;
      const drawWidth = displayWidth * ratio;
      const drawHeight = displayHeight * ratio;
      const drawX = (OUTPUT_DIMENSION - drawWidth) / 2 + pan.x * ratio;
      const drawY = (OUTPUT_DIMENSION - drawHeight) / 2 + pan.y * ratio;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
      });

      if (!blob) {
        throw new Error("Canvas export failed");
      }

      const croppedFile = new File([blob], selectedFile.name, {
        type: "image/jpeg",
      });

      const result = await UploadProfilePicture(croppedFile);
      setPreviewImage(getProfilePictureUrl(result.url));
      await refresh();
      triggerToast("Profile picture updated successfully.");
      cleanupCrop();
    } catch (error) {
      console.error(
        "[handleConfirmCrop] {UploadProfilePicture}: upload error",
        error,
      );
      triggerToast("Unable to upload profile picture. Please try again.");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isLoading = userId ? !!isLoadingTarget : !authUser;

  usePageMetadata(
    useMemo(
      () => ({
        title: userId ? "User Profile View" : "Account Profile",
        isLoading,
        badgeText: "Management",
        badgeIcon: <Settings size={16} />,
      }),
      [userId, isLoading],
    ),
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1700px] flex-col space-y-8 pb-12",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-10 rounded-[32px] border",
            "border-glass-border bg-glass-bg p-8 shadow-md md:flex-row",
            "md:items-start md:p-12",
          )}
        >
          <Skeleton className="h-28 w-28 rounded-full sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex justify-center gap-3 md:justify-start">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mx-auto h-10 w-64 md:mx-0" />
              <Skeleton className="mx-auto h-6 w-48 md:mx-0" />
            </div>
            <div className="border-t border-border/20 pt-6">
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton className="h-72 rounded-2xl md:col-span-2" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">
          User not found or access denied.
        </p>
      </div>
    );
  }

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
          "transition-all duration-500 hover:shadow-primary/5 md:p-12",
        )}
      >
        <div
          className={cn(
            "relative flex flex-col items-center gap-8 md:flex-row",
            "md:items-start",
          )}
        >
          {/* Avatar Section */}
          <div className="group/avatar relative shrink-0">
            <div
              className={cn(
                "relative h-28 w-28 rounded-full bg-primary/20",
                "p-1 shadow-xl sm:h-32 sm:w-32",
              )}
            >
              <Avatar
                className={cn(
                  "relative z-10 h-full w-full rounded-full border-4",
                  "border-card shadow-sm",
                )}
              >
                <AvatarImage
                  key={
                    previewImage || user?.profilePicture || "profile-picture"
                  }
                  src={
                    previewImage || getProfilePictureUrl(user?.profilePicture)
                  }
                  alt={`${user.firstName} ${user.lastName}`}
                  className={cn(
                    "object-cover object-center transition-transform",
                    "duration-500 group-hover/avatar:scale-105",
                  )}
                />
                <AvatarFallback
                  className={cn(
                    "bg-muted text-3xl font-bold uppercase",
                    "text-muted-foreground sm:text-4xl",
                  )}
                >
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {!userId && (
              <>
                <Button
                  type="button"
                  size="icon"
                  onClick={triggerFileInput}
                  className={cn(
                    "absolute bottom-0 right-0 z-20 h-9 w-9 rounded-full",
                    "shadow-lg transition-transform hover:scale-110",
                    "active:scale-95",
                  )}
                  title="Change profile picture"
                  disabled={isUploadingPicture}
                >
                  <Camera size={16} />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />
              </>
            )}
          </div>

          {/* User Essential Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div
                className={cn(
                  "flex flex-wrap items-center justify-center gap-3",
                  "md:justify-start",
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full border-primary/10 bg-primary/10 px-3 py-1",
                    "text-primary backdrop-blur-md",
                  )}
                >
                  {userType.toUpperCase()} ACCOUNT
                </Badge>
                {user.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="secondary"
                    className={cn(
                      "rounded-full bg-muted/60 px-3 py-1 text-[10px]",
                      "font-semibold uppercase text-foreground",
                    )}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
              <h1
                className={cn(
                  "bg-gradient-to-r from-foreground to-foreground/60",
                  "bg-clip-text text-2xl tracking-tight text-foreground",
                  "md:text-4xl",
                )}
              >
                {user.firstName}{" "}
                {user.middleName && `${user.middleName[0]}. `}
                {user.lastName}
              </h1>
              <p className="text-base font-medium text-muted-foreground/80">
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
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    "text-muted-foreground/60",
                  )}
                >
                  Last Login
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <Clock size={12} className="text-blue-400" />{" "}
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
      <Tabs defaultValue="overview" className="space-y-6">
        <div
          className={cn(
            "flex flex-col justify-between gap-4 md:flex-row md:items-center",
          )}
        >
          <TabsList
            className={cn(
              "h-auto self-start rounded-2xl border border-glass-border",
              "bg-glass-bg p-1 shadow-md backdrop-blur-md",
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
              "shadow-md backdrop-blur-xl transition-colors md:col-span-2",
            )}
          >
            <CardHeader
              className={cn(
                "border-b border-glass-border bg-glass-bg p-5 sm:p-8",
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start",
                  "sm:justify-between",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <CardTitle
                    className="flex items-center gap-2 text-2xl font-bold"
                  >
                    <User className="text-primary" size={24} />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Primary account details that identify you in the system.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "w-fit shrink-0 gap-1 rounded-full",
                    "border-muted-foreground/20 bg-muted/50 px-3 py-1",
                    "text-xs text-muted-foreground",
                  )}
                >
                  <Lock size={12} />
                  Read-only
                </Badge>
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
                      "flex h-10 items-center rounded-xl border",
                      "border-border/10 bg-muted/40 px-4 text-sm font-bold",
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
                        "flex h-10 items-center rounded-xl border",
                        "border-border/10 bg-muted/40 px-4 text-sm font-bold",
                        "italic text-muted-foreground",
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
                      "flex h-10 items-center rounded-xl border",
                      "border-border/10 bg-muted/40 px-4 text-sm font-bold",
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
                    <Mail size={16} className="text-blue-500" />
                    {user.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "self-start overflow-hidden rounded-2xl border-glass-border",
              "bg-glass-bg shadow-md backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-glass-border p-8">
              <CardTitle className="text-lg font-bold">Quick Stats</CardTitle>
              <CardDescription>Engagement and account metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-3 gap-4">
                <div
                  className={cn(
                    "rounded-2xl border border-border/10 bg-muted/30",
                    "p-4 text-center",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-[10px] font-bold text-muted-foreground/60",
                    )}
                  >
                    LOGINS
                  </p>
                  <p className="text-xl">{stats.logins}</p>
                </div>
                <div
                  className={cn(
                    "col-span-2 rounded-2xl border border-primary/20",
                    "bg-gradient-to-br from-primary/10 to-blue-500/10 p-6",
                    "shadow-inner",
                  )}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Calendar size={16} className="text-primary" />
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
        <TabsContent value="activity" className="outline-none">
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
                <div
                  className={cn(
                    "flex flex-col items-center justify-center space-y-4",
                    "py-24",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 animate-spin rounded-full border-4",
                      "border-primary border-t-transparent",
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
                        "group flex gap-4 rounded-2xl border",
                        "border-border/10 bg-muted/20 p-4 transition-all",
                        "hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center",
                          "justify-center rounded-xl p-2",
                          log.category === "SECURITY" &&
                            "bg-blue-500/10 text-blue-500",
                          log.category === "AUDIT" &&
                            "bg-amber-500/10 text-amber-500",
                          log.category !== "SECURITY" &&
                            log.category !== "AUDIT" &&
                            "bg-primary/10 text-primary",
                        )}
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
                          <span
                            className={cn(
                              "text-[10px] font-medium text-muted-foreground",
                            )}
                          >
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "text-xs leading-relaxed text-muted-foreground",
                          )}
                        >
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length > 10 && (
                    <p
                      className={cn(
                        "pt-4 text-center text-[10px] italic",
                        "text-muted-foreground",
                      )}
                    >
                      Showing last 10 activities.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-xs space-y-6 py-24 text-center">
                  <div
                    className={cn(
                      "mx-auto mb-6 flex h-20 w-20 items-center",
                      "justify-center rounded-full border-4 border-card",
                      "bg-muted shadow-inner",
                    )}
                  >
                    <Clock size={32} className="text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-bold">No recent activities</h3>
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground",
                    )}
                  >
                    Your recent activities, login history, and system logs will
                    appear here as you interact with the platform.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Crop & Adjustment Modal */}
      <Dialog
        open={cropModalOpen}
        onOpenChange={(open) => !open && cleanupCrop()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Profile Picture</DialogTitle>
            <DialogDescription>
              Drag to reposition your photo and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Circular Preview Mask */}
            <div
              className={cn(
                "relative h-64 w-64 touch-none select-none",
                "overflow-hidden rounded-full border-4 border-primary/20",
                "bg-muted shadow-inner",
                isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {cropImageSrc && (
                <img
                  src={cropImageSrc}
                  alt="Crop Preview"
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    left: `calc(50% + ${pan.x}px - ${displayWidth / 2}px)`,
                    top: `calc(50% + ${pan.y}px - ${displayHeight / 2}px)`,
                    maxWidth: "none",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            {/* Zoom Slider */}
            <div className="w-full max-w-xs space-y-2">
              <div
                className={cn(
                  "flex items-center justify-between text-xs",
                  "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <ZoomOut size={14} /> Zoom
                </span>
                <span className="font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([val]) => handleZoomChange(val)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cleanupCrop}
              disabled={isUploadingPicture}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={isUploadingPicture}
            >
              {isUploadingPicture ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
