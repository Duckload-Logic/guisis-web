import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FormSectionSkeleton() {
  return (
    <div
      className={cn(
        "space-y-6 rounded-3xl border border-glass-border",
        "bg-glass-bg p-6 shadow-md",
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <hr className="border-glass-border" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
