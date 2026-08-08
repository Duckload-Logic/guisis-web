import { Checkbox } from "@/components/form";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export function HealthArea({
  title,
  fieldPrefix,
  hasData,
  details,
  onChange,
}: {
  title: string;
  fieldPrefix: string;
  hasData: boolean;
  details: string;
  onChange: (path: string, value: any) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-md">
      <div className="mb-3 flex items-center gap-3">
        <Checkbox
          id={`has-${title}`}
          label={`Has ${title.toLowerCase()} Problem`}
          name={`has-${title}`}
          checked={hasData}
          onCheckedChange={(checked: boolean | "indeterminate") =>
            onChange(`${fieldPrefix}HasProblem`, checked === true)
          }
        />
      </div>

      {hasData && (
        <FormField
          label="Details"
          isTextarea
          value={details}
          onChange={(val) => onChange(`${fieldPrefix}Details`, val)}
          placeholder={cn("Describe the problem")}
        />
      )}
    </div>
  );
}
