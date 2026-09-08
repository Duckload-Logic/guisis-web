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
import { Badge } from "@/components/ui/badge";
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
    `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`
      .toUpperCase() || "ST";

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
        "group relative flex flex-col justify-between overflow-hidden",
        "rounded-2xl border border-border/70 bg-card/70 shadow-sm",
        "backdrop-blur-xl transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-xs font-bold uppercase",
              "tracking-wider text-muted-foreground",
            )}
          >
            <ShieldUser className="h-4 w-4 text-primary" />
            Student Profile
          </CardTitle>
          {student.studentNumber && (
            <Badge
              variant="outline"
              onClick={handleCopyStudentNumber}
              className={cn(
                "cursor-pointer gap-1.5 rounded-lg border-border/60 font-mono",
                "text-[11px] font-semibold text-foreground/80 transition-colors",
                "hover:border-primary/40 hover:bg-primary/5",
              )}
              title="Click to copy student number"
            >
              {hasCopiedId ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
              {student.studentNumber}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between space-y-5 p-5">
        {/* Identity row */}
        <div className="flex items-center gap-4">
          <Avatar
            className={cn(
              "h-16 w-16 shrink-0 rounded-2xl border-2 border-border/80",
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
                "rounded-2xl bg-primary/10 text-lg font-bold uppercase",
                "text-primary",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={cn(
                "truncate text-base font-bold tracking-tight text-foreground",
              )}
              title={fullName}
            >
              {fullName || "Unknown Student"}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">
              {student.studentNumber || "No ID Number"}
            </p>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 gap-2.5 rounded-xl border bg-muted/10 p-3">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
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
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Contact Number
              </p>
              <p className="truncate font-medium text-foreground/90">
                {student.contactNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick redirect actions */}
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
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
