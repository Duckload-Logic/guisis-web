import { useState, useEffect } from "react";
import { Check, Users, User, ShieldCheck } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CounselorProfileView } from "@/features/appointments/types";

interface CounselorPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselors: CounselorProfileView[];
  isLoading?: boolean;
  selectedCounselorId?: string;
  selectedPreference?: string;
  onSelect: (counselorId?: string, preferenceLabel?: string) => void;
}

export function formatCounselorFullName(c: CounselorProfileView): string {
  const parts = [c.title, c.firstName];
  if (c.middleName) {
    parts.push(`${c.middleName.charAt(0)}.`);
  }
  parts.push(c.lastName);
  if (c.suffixName) {
    parts.push(c.suffixName);
  }
  return parts.filter(Boolean).join(" ");
}

export function formatCounselorOptionLabel(c: CounselorProfileView): string {
  const fullName = formatCounselorFullName(c);
  return `${c.gender.toUpperCase()} - ${fullName}`;
}

export function CounselorPreferenceModal({
  isOpen,
  onClose,
  counselors,
  isLoading = false,
  selectedCounselorId,
  selectedPreference,
  onSelect,
}: CounselorPreferenceModalProps) {
  const [tempCounselorId, setTempCounselorId] = useState<string | undefined>(
    selectedCounselorId,
  );
  const [tempPreference, setTempPreference] = useState<string | undefined>(
    selectedPreference,
  );

  useEffect(() => {
    if (isOpen) {
      setTempCounselorId(selectedCounselorId);
      setTempPreference(selectedPreference);
    }
  }, [isOpen, selectedCounselorId, selectedPreference]);

  const handleSelectCounselor = (c: CounselorProfileView) => {
    setTempCounselorId(c.userId);
    setTempPreference(formatCounselorOptionLabel(c));
  };

  const handleSelectNoPreference = () => {
    setTempCounselorId(undefined);
    setTempPreference("NO PREFERENCE");
  };

  const handleConfirm = () => {
    onSelect(tempCounselorId, tempPreference);
    onClose();
  };

  const isNoPreferenceSelected =
    tempPreference === "NO PREFERENCE" ||
    (!tempCounselorId && !tempPreference);

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <ResponsiveModalHeader className="border-b border-border/60 pb-3 text-left">
          <Badge
            variant="outline"
            className="mb-1.5 w-fit rounded-full text-[11px] font-semibold text-primary"
          >
            Counselor Selection
          </Badge>
          <ResponsiveModalTitle className="text-sm font-bold uppercase tracking-tight sm:text-base">
            For students seeking counseling for the first time, kindly select
            your preference:
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-xs text-muted-foreground">
            Choose your preferred counselor or opt for No Preference. The
            Guidance Office will accommodate your preference based on
            availability.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="text-xs text-muted-foreground">
                Loading available counselors...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {/* Dynamic Counselor Cards */}
              {counselors.map((c) => {
                const isSelected = tempCounselorId === c.userId;
                const initials = `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`;
                const fullName = formatCounselorFullName(c);

                return (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => handleSelectCounselor(c)}
                    className={cn(
                      "group relative flex min-h-[170px] flex-col items-center",
                      "justify-center rounded-2xl border p-4 text-center",
                      "transition-all duration-200 focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-primary min-h-11",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary"
                        : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Centerpiece Profile Picture Avatar */}
                    <Avatar className="mb-2.5 h-16 w-16 border-2 border-background shadow-sm ring-2 ring-primary/20">
                      <AvatarImage
                        src={c.profilePicture}
                        alt={fullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {initials ? initials : <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="mb-1 space-y-0.5">
                      <p className="line-clamp-2 text-xs font-bold leading-snug text-foreground">
                        {fullName}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {c.position || "Guidance Counselor"}
                      </p>
                    </div>

                    <Badge
                      variant="secondary"
                      className="mt-1 text-[10px] uppercase font-semibold"
                    >
                      {c.gender}
                    </Badge>
                  </button>
                );
              })}

              {/* No Preference Card */}
              <button
                type="button"
                onClick={handleSelectNoPreference}
                className={cn(
                  "group relative flex min-h-[170px] flex-col items-center",
                  "justify-center rounded-2xl border p-4 text-center",
                  "transition-all duration-200 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary min-h-11",
                  isNoPreferenceSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary"
                    : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                {isNoPreferenceSelected && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}

                <div className="mb-2.5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 text-primary">
                  <Users className="h-7 w-7" />
                </div>

                <div className="mb-1 space-y-0.5">
                  <p className="text-xs font-bold leading-snug text-foreground">
                    No Preference
                  </p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    Any available counselor
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="mt-1 text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  Any Counselor
                </Badge>
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>
            Your selection helps the Guidance Office assign the most appropriate
            counselor to support you.
          </span>
        </div>

        <ResponsiveModalFooter className="border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="min-h-11 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="min-h-11 text-xs font-semibold"
          >
            Confirm Preference
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}