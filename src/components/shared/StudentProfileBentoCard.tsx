import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  User,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldUser,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profilePicture";

export interface StudentProfileData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  studentNumber?: string;
  contactNumber?: string;
  profilePicture?: string;
  iirId?: string;
  studentCorUrl?: string;
}

interface StudentProfileBentoCardProps {
  student: StudentProfileData;
  onViewCor?: () => void;
  canAccessIir?: boolean;
  className?: string;
}

export function StudentProfileBentoCard({
  student,
  onViewCor,
  canAccessIir = true,
  className,
}: StudentProfileBentoCardProps) {
  const navigate = useNavigate();
  const [hasCopiedId, setHasCopiedId] = useState(false);

  const fullName = [
    student.firstName,
    student.middleName ? `${student.middleName[0]}.` : "",
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const initials =
    `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase() ||
    "ST";

  const profilePicUrl = getProfilePictureUrl(student.profilePicture);

  const handleCopyStudentNumber = () => {
    if (!student.studentNumber) return;
    navigator.clipboard.writeText(student.studentNumber);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70",
        "bg-card/70 shadow-sm backdrop-blur-xl transition-all duration-300",
        "hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-3.5">
        <CardTitle
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase",
            "tracking-wider text-muted-foreground",
          )}
        >
          <ShieldUser className="h-4 w-4 text-primary" />
          Student Profile
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {/* Identity row */}
        <div className="flex items-center gap-3.5">
          <Avatar
            className={cn(
              "h-14 w-14 shrink-0 rounded-2xl border-2 border-border/80",
              "shadow-sm",
            )}
          >
            <AvatarImage
              src={profilePicUrl}
              alt={fullName || "Student photo"}
              className="object-cover"
            />
            <AvatarFallback
              className={cn(
                "rounded-2xl bg-primary/10 text-base font-bold uppercase",
                "text-primary",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className="truncate text-base font-bold tracking-tight text-foreground"
              title={fullName}
            >
              {fullName || "Unknown Student"}
            </h3>

            {student.studentNumber ? (
              <button
                type="button"
                onClick={handleCopyStudentNumber}
                className={cn(
                  "flex items-center gap-1.5 font-mono text-xs text-muted-foreground",
                  "transition-colors hover:text-foreground",
                )}
                title="Click to copy student number"
              >
                {hasCopiedId ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 opacity-60" />
                )}
                <span>{student.studentNumber}</span>
              </button>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                No Student ID
              </p>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 gap-2 rounded-xl border bg-muted/10 p-3">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Email
              </p>
              <p
                className="truncate font-medium text-foreground/90"
                title={student.email}
              >
                {student.email || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Contact Number
              </p>
              <p className="truncate font-medium text-foreground/90">
                {student.contactNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick redirect actions */}
        <div className="grid grid-cols-1 gap-2 pt-0.5 sm:grid-cols-2">
          {canAccessIir && student.iirId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/admin/student-records/${student.iirId}`)
              }
              className={cn(
                "h-9 w-full gap-2 rounded-xl border-primary/25 bg-primary/5",
                "text-xs font-semibold text-primary transition-all",
                "hover:-translate-y-0.5 hover:bg-primary hover:text-white",
              )}
            >
              <User className="h-3.5 w-3.5" />
              IIR Record
              <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
            </Button>
          )}

          {student.studentCorUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewCor}
              className={cn(
                "h-9 w-full gap-2 rounded-xl border-border/80 bg-background/80",
                "text-xs font-semibold text-foreground/90 transition-all",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              View COR
              <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
