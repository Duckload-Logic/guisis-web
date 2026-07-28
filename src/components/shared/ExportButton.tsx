import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function ExportButton({
  onClick,
  disabled,
  label = "Export CSV",
}: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2 rounded-xl border-glass-border bg-glass-bg",
        "shadow-sm hover:bg-glass-bg/80",
      )}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}