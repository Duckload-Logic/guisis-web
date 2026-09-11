import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";

export interface FormErrorItem {
  fieldPath: string;
  message: string;
}

export type GroupedErrors = Record<string, FormErrorItem[]>;

export const groupErrorsBySection = (
  errors: Record<string, string>,
): GroupedErrors => {
  const groups: GroupedErrors = {
    "Personal Info": [],
    "Education Background": [],
    "Family Background": [],
    "Health Info": [],
    Interests: [],
  };

  Object.entries(errors).forEach(([path, message]) => {
    if (path.startsWith("student."))
      groups["Personal Info"].push({ fieldPath: path, message });
    else if (path.startsWith("education."))
      groups["Education Background"].push({ fieldPath: path, message });
    else if (path.startsWith("family."))
      groups["Family Background"].push({ fieldPath: path, message });
    else if (path.startsWith("health."))
      groups["Health Info"].push({ fieldPath: path, message });
    else if (path.startsWith("interests."))
      groups["Interests"].push({ fieldPath: path, message });
    else groups["Personal Info"].push({ fieldPath: path, message });
  });

  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length > 0),
  );
};

const getSectionIdForField = (fieldPath: string): number => {
  if (fieldPath.startsWith("student.")) {
    if (
      fieldPath.startsWith("student.basicInfo") ||
      fieldPath.includes("suffix") ||
      fieldPath.includes("studentNumber") ||
      fieldPath.includes("program")
    ) {
      return 1;
    }
    if (
      fieldPath.includes("gender") ||
      fieldPath.includes("civilStatus") ||
      fieldPath.includes("religion") ||
      fieldPath.includes("dateOfBirth") ||
      fieldPath.includes("placeOfBirth") ||
      fieldPath.includes("highSchoolGWA") ||
      fieldPath.includes("heightM") ||
      fieldPath.includes("weightKg") ||
      fieldPath.includes("complexion")
    ) {
      return 2;
    }
    if (
      fieldPath.includes("addresses") ||
      fieldPath.includes("emergencyContact") ||
      fieldPath.includes("mobileNumber") ||
      fieldPath.includes("telephoneNumber")
    ) {
      return 3;
    }
    if (
      fieldPath.includes("isEmployed") ||
      fieldPath.includes("employerName") ||
      fieldPath.includes("employerAddress") ||
      fieldPath.includes("employerContactNumber")
    ) {
      return 4;
    }
    return 1;
  }

  if (fieldPath.startsWith("education.")) {
    return 5;
  }

  if (fieldPath.startsWith("family.")) {
    if (fieldPath.includes("relatedPersons.0")) {
      return 7;
    }
    if (fieldPath.includes("relatedPersons.1")) {
      return 8;
    }
    if (
      fieldPath.includes("relatedPersons.2") ||
      fieldPath.includes("finance.siblings")
    ) {
      return 9;
    }
    return 6;
  }

  if (fieldPath.startsWith("health.")) {
    return 10;
  }

  if (fieldPath.startsWith("interests.")) {
    return 11;
  }

  return 1;
};

const findElement = (
  fieldPath: string,
  errorMessage: string,
): HTMLElement | null => {
  let el = document.querySelector(
    `[name="${fieldPath}"], [id="${fieldPath}"], [data-path="${fieldPath}"]`,
  ) as HTMLElement;
  if (el) return el;

  if (errorMessage) {
    const errorEls = Array.from(
      document.querySelectorAll("p, span, div"),
    ).filter((e) => e.textContent?.trim() === errorMessage.trim());
    for (const errEl of errorEls) {
      const container = errEl.closest("div.space-y-2, div.grid, td, tr, div");
      if (container) {
        const input = container.querySelector(
          "input, select, textarea, button",
        ) as HTMLElement;
        if (input) return input;
      }
    }
  }

  const lastPart = fieldPath.split(".").pop();
  if (lastPart) {
    el = document.querySelector(
      `[name*="${lastPart}"], [id*="${lastPart}"]`,
    ) as HTMLElement;
    if (el) return el;
  }

  return null;
};

interface FormErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedErrors: GroupedErrors;
  totalErrors: number;
  onNavigateToSection: (sectionId: number) => void;
}

export function FormErrorModal({
  isOpen,
  onClose,
  groupedErrors,
  totalErrors,
  onNavigateToSection,
}: FormErrorModalProps) {
  const handleDeepLinkClick = (
    fieldPath: string,
    sectionTitle: string,
    errorMessage: string,
  ) => {
    onClose();

    const sectionId = getSectionIdForField(fieldPath);
    onNavigateToSection(sectionId);

    setTimeout(() => {
      const element = findElement(fieldPath, errorMessage);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });

        // Visual Cue: pulse effect
        const targetElement = element as HTMLElement;
        const originalTransition = targetElement.style.transition;
        const originalBoxShadow = targetElement.style.boxShadow;

        targetElement.style.transition = "all 0.3s ease-in-out";
        targetElement.style.boxShadow = "0 0 0 4px rgba(220, 38, 38, 0.4)";
        targetElement.focus();

        setTimeout(() => {
          targetElement.style.boxShadow = originalBoxShadow;
          setTimeout(() => {
            targetElement.style.transition = originalTransition;
          }, 300);
        }, 1500);
      }
    }, 250);
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveModalContent
        className="flex max-h-[85vh] flex-col p-0 sm:max-w-lg"
      >
        <ResponsiveModalHeader className="border-b px-6 py-4">
          <ResponsiveModalTitle
            className={cn(
              "flex items-center gap-2 text-xl font-bold text-destructive",
            )}
          >
            <AlertCircle className="h-5 w-5" />
            Action Required
          </ResponsiveModalTitle>
          <ResponsiveModalDescription
            className="text-sm text-muted-foreground"
          >
            We found{" "}
            <span className="font-bold text-foreground">
              {totalErrors} items
            </span>{" "}
            that need your attention before you can submit the form.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div
          className={cn(
            "custom-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-4",
          )}
        >
          {Object.entries(groupedErrors).map(([sectionTitle, errors]) => (
            <div
              key={sectionTitle}
              className="space-y-3"
            >
              <h3
                className={cn(
                  "border-b pb-1 text-sm font-semibold uppercase",
                  "text-muted-foreground",
                )}
              >
                {sectionTitle}
              </h3>
              <div className="space-y-2">
                {errors.map((error, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleDeepLinkClick(
                        error.fieldPath,
                        sectionTitle,
                        error.message,
                      )
                    }
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-lg border",
                      "border-border bg-card p-3 text-left transition-colors",
                      "hover:border-destructive hover:bg-destructive/5",
                      "focus:outline-none focus:ring-2",
                      "focus:ring-destructive/20",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-4 min-w-[4px] rounded-full bg-destructive",
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 pr-2 text-sm leading-tight text-foreground",
                      )}
                    >
                      {error.message}
                    </span>
                    <ChevronRight
                      className={cn(
                        "mt-0.5 h-4 w-4 text-muted-foreground",
                        "transition-all group-hover:translate-x-1",
                        "group-hover:text-destructive",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ResponsiveModalFooter className="border-t border-border px-6 py-4">
          <Button
            onClick={onClose}
            className={cn(
              "w-full bg-destructive text-white",
              "hover:bg-destructive/90",
            )}
          >
            Got it, I&apos;ll fix them
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
