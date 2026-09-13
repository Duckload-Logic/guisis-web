import { Calendar, Clock, ChevronRight, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import { format12HourTime } from "@/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  profilePicture?: string;
}

interface AppointmentItem {
  id: string | number;
  user?: UserProfile;
  appointmentCategory?: { name?: string };
  status?: { name?: string };
  timeSlot?: { time?: string };
}

interface TodayAppointmentsCardProps {
  isLoading: boolean;
  appointments: AppointmentItem[];
  formattedToday: string;
  onViewAll: () => void;
  onSelectAppointment: (id: string | number) => void;
}

function getUserInitials(user?: UserProfile): string {
  const firstInitial = user?.firstName?.trim()?.[0] || "";
  const lastInitial = user?.lastName?.trim()?.[0] || "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "ST";
}

function getUserFullName(user?: UserProfile): string {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student"
  );
}

export function TodayAppointmentsCard({
  isLoading,
  appointments,
  formattedToday,
  onViewAll,
  onSelectAppointment,
}: TodayAppointmentsCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border",
        "shadow-xs border-glass-border bg-card/60 backdrop-blur-xl",
        "lg:col-span-8",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between border-b",
          "border-glass-border bg-muted/20 px-6 py-4",
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-foreground">
              Today&apos;s Appointments
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "rounded-lg border-primary/20 bg-primary/10 px-2",
                "py-0.5 text-[10px] font-bold text-primary",
              )}
            >
              {formattedToday}
            </Badge>
          </div>
          <CardDescription className="mt-0.5 text-xs text-muted-foreground">
            Upcoming consultations queued for counseling today
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onViewAll}
          className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
        >
          <span>View All</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between rounded-xl border",
                  "border-glass-border bg-muted/20 p-3",
                )}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-12",
              "text-center",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                "border border-glass-border bg-muted/40",
                "text-muted-foreground shadow-inner",
              )}
            >
              <Calendar className="h-6 w-6 text-primary/70" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-foreground">
              No appointments scheduled for today
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Your counseling agenda is clear today. View the master calendar to
              review upcoming dates or manage bookings.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="mt-4 h-8 gap-1.5 rounded-xl px-3 text-xs"
            >
              Open Appointments Calendar
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => onSelectAppointment(apt.id)}
                className={cn(
                  "group flex flex-col gap-3 p-4 transition-colors",
                  "cursor-pointer hover:bg-muted/30 sm:flex-row",
                  "sm:items-center sm:justify-between sm:px-6",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-full",
                      "border border-glass-border",
                    )}
                  >
                    <AvatarImage
                      src={getProfilePictureUrl(apt.user?.profilePicture)}
                      alt={getUserFullName(apt.user)}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className={cn(
                        "rounded-full bg-primary/10 text-xs font-bold",
                        "text-primary",
                      )}
                    >
                      {getUserInitials(apt.user)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold text-foreground",
                        "transition-colors group-hover:text-primary",
                      )}
                    >
                      {getUserFullName(apt.user)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {apt.user?.studentNumber || "No Student ID"}
                      {" \u2022 "}
                      <span className="font-medium text-foreground/75">
                        {apt.appointmentCategory?.name}
                      </span>
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between gap-3",
                    "sm:justify-end",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px]",
                        "font-bold uppercase tracking-wider",
                        STATUS_COLORS[getStatusColorKey(apt.status?.name)],
                      )}
                    >
                      {apt.status?.name || "Pending"}
                    </Badge>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg",
                        "border border-border/60 bg-muted/40 px-2.5 py-1",
                        "text-xs font-semibold text-foreground",
                      )}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {format12HourTime(apt.timeSlot?.time || "")}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center",
                      "rounded-lg text-muted-foreground/60",
                      "transition-colors group-hover:bg-primary/10",
                      "group-hover:text-primary",
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
