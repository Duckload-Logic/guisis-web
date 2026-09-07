import { capitalizeWords } from "@/utils";

export const getActionBadgeColor = (action: string): string => {
  const upper = action.toUpperCase();

  if (
    upper.endsWith("_FAILED") ||
    upper.endsWith("_DENIED") ||
    upper.endsWith("_REVOKED") ||
    upper.endsWith("_INVALID") ||
    upper.endsWith("_FAIL")
  ) {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }

  if (
    upper.endsWith("_CREATED") ||
    upper.endsWith("_SUCCESS") ||
    upper.endsWith("_SUBMITTED") ||
    upper.endsWith("_COMPLETED")
  ) {
    return (
      "border-success-foreground/20 bg-success-background " +
      "text-success-foreground"
    );
  }

  if (
    upper.endsWith("_UPDATED") ||
    upper.endsWith("_CHANGED") ||
    upper.endsWith("_STATUS_UPDATED")
  ) {
    return "border-info-foreground/20 bg-info-background text-info-foreground";
  }

  if (
    upper.endsWith("_DELETED") ||
    upper.endsWith("_BLOCKED") ||
    upper.endsWith("_EXCEEDED")
  ) {
    return (
      "border-warning-foreground/20 bg-warning-background " +
      "text-warning-foreground"
    );
  }

  if (
    upper.endsWith("_SAVED") ||
    upper.endsWith("_REFRESHED") ||
    upper.endsWith("_USED") ||
    upper.endsWith("_VERIFIED") ||
    upper.endsWith("_ACCESS")
  ) {
    return "border-info-foreground/20 bg-info-background text-info-foreground";
  }

  return (
    "border-stale-foreground/20 bg-stale-background " +
    "text-stale-foreground"
  );
};

export const formatAction = (action: string) => {
  return capitalizeWords(action.replace(/_/g, " "));
};
