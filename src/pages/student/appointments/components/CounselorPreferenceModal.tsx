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

export interface CounselorGenderStyle {
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  badge: string;
  avatarRing: string;
  avatarFallback: string;
}

/**
 * Returns subtle institutional color tokens based on counselor gender.
 * Avoids gaudy pillars, harsh neon, or distracting saturated blocks.
 */
export function getCounselorGenderStyle(gender?: string): CounselorGenderStyle {
  const g = gender?.toUpperCase() || "";
  if (g === "FEMALE") {
    return {
      cardBg: "bg-rose-500/[0.03] dark:bg-rose-500/[0.05]",
      cardBorder: "border-rose-500/20 dark:border-rose-500/30",
      cardHover: "hover:border-rose-500/40 hover:bg-rose-500/[0.06]",
      badge:
        "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      avatarRing: "ring-rose-500/25",
      avatarFallback: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }
  if (g === "MALE") {
    return {
      cardBg: "bg-sky-500/[0.03] dark:bg-sky-500/[0.05]",
      cardBorder: "border-sky-500/20 dark:border-sky-500/30",
      cardHover: "hover:border-sky-500/40 hover:bg-sky-500/[0.06]",
      badge:
        "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      avatarRing: "ring-sky-500/25",
      avatarFallback: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }
  return {
    cardBg: "bg-violet-500/[0.03] dark:bg-violet-500/[0.05]",
    cardBorder: "border-violet-500/20 dark:border-violet-500/30",
    cardHover: "hover:border-violet-500/40 hover:bg-violet-500/[0.06]",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    avatarRing: "ring-violet-500/25",
    avatarFallback: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };
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

  const safeCounselors = Array.isArray(counselors) ? counselors : [];

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
              {safeCounselors.map((c) => {
                const isSelected = tempCounselorId === c.userId;
                const initials =
                  `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`;
                const fullName = formatCounselorFullName(c);
                const genderStyle = getCounselorGenderStyle(c.gender);

                return (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => handleSelectCounselor(c)}
                    className={cn(
                      "group relative flex min-h-[175px] flex-col items-center",
                      "justify-center rounded-2xl border p-4 text-center",
                      "transition-all duration-200 focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-primary min-h-11",
                      genderStyle.cardBg,
                      isSelected
                        ? "border-primary ring-2 ring-primary shadow-sm"
                        : cn(genderStyle.cardBorder, genderStyle.cardHover),
                    )}
                  >
                    {isSelected && (
                      <span
                        className={cn(
                          "absolute right-2.5 top-2.5 flex h-5 w-5",
                          "items-center justify-center rounded-full bg-primary",
                          "text-primary-foreground shadow-sm",
                        )}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Centerpiece Profile Picture Avatar */}
                    <Avatar
                      className={cn(
                        "mb-2.5 h-16 w-16 border-2 border-background shadow-sm ring-2",
                        isSelected
                          ? "ring-primary/40"
                          : genderStyle.avatarRing,
                      )}
                    >
                      <AvatarImage
                        src={c.profilePicture}
                        alt={fullName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "text-xs font-bold",
                          genderStyle.avatarFallback,
                        )}
                      >
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

                    <span
                      className={cn(
                        "mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        genderStyle.badge,
                      )}
                    >
                      {c.gender}
                    </span>
                  </button>
                );
              })}

              {/* No Preference Card */}
              <button
                type="button"
                onClick={handleSelectNoPreference}
                className={cn(
                  "group relative flex min-h-[175px] flex-col items-center",
                  "justify-center rounded-2xl border p-4 text-center",
                  "transition-all duration-200 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary min-h-11",
                  "bg-muted/10",
                  isNoPreferenceSelected
                    ? "border-primary ring-2 ring-primary shadow-sm bg-primary/5"
                    : "border-border/70 hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                {isNoPreferenceSelected && (
                  <span
                    className={cn(
                      "absolute right-2.5 top-2.5 flex h-5 w-5",
                      "items-center justify-center rounded-full bg-primary",
                      "text-primary-foreground shadow-sm",
                    )}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}

                <div
                  className={cn(
                    "mb-2.5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed shadow-sm",
                    isNoPreferenceSelected
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground bg-muted/20",
                  )}
                >
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

                <span className="mt-1 inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Any Counselor
                </span>
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
