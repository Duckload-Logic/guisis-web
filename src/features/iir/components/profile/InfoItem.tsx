import { cn } from "@/lib/utils";
export default function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="group flex min-w-0 flex-col">
      <span
        className={cn(
          "mb-1 text-[10px] font-bold uppercase tracking-tight",
          "text-muted-foreground transition-colors",
          "group-hover:text-primary",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "origin-left break-words border-l-2 border-transparent pl-0 text-xs",
          "font-medium text-card-foreground transition-all",
          "group-hover:border-primary/30 group-hover:pl-3",
        )}
      >
        {value || "---"}
      </span>
    </div>
  );
}
