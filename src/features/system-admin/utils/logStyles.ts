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
    return (
      "border-red-500/20 bg-red-500/10 text-red-700" + " dark:text-red-400"
    );
  }

  if (
    upper.endsWith("_CREATED") ||
    upper.endsWith("_SUCCESS") ||
    upper.endsWith("_SUBMITTED") ||
    upper.endsWith("_COMPLETED")
  ) {
    return (
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" +
      " dark:text-emerald-400"
    );
  }

  if (
    upper.endsWith("_UPDATED") ||
    upper.endsWith("_CHANGED") ||
    upper.endsWith("_STATUS_UPDATED")
  ) {
    return (
      "border-blue-500/20 bg-blue-500/10 text-blue-700" + " dark:text-blue-400"
    );
  }

  if (
    upper.endsWith("_DELETED") ||
    upper.endsWith("_BLOCKED") ||
    upper.endsWith("_EXCEEDED")
  ) {
    return (
      "border-amber-500/20 bg-amber-500/10 text-amber-700" +
      " dark:text-amber-400"
    );
  }

  if (
    upper.endsWith("_SAVED") ||
    upper.endsWith("_REFRESHED") ||
    upper.endsWith("_USED") ||
    upper.endsWith("_VERIFIED") ||
    upper.endsWith("_ACCESS")
  ) {
    return (
      "border-blue-500/20 bg-blue-500/10 text-blue-700" +
      " dark:text-blue-400"
    );
  }

  return (
    "border-slate-500/20 bg-slate-500/10 text-slate-700" +
    " dark:text-slate-300"
  );
};

export const formatAction = (action: string) => {
  return capitalizeWords(action.replace(/_/g, " "));
};
