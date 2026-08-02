import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment } from "../types";
import { SelectField } from "@/components/ui/select-field";
import { useCategories } from "../hooks";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  data: Appointment;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
  showSubmitButton?: boolean;
}

export default function AppointmentForm({
  data,
  onChange,
  onSubmit,
  isLoading,
  isSubmitting,
  showSubmitButton = true,
}: AppointmentFormProps) {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  const isFormValid =
    !!data.whenDate &&
    !!data.timeSlot?.id &&
    !!data.appointmentCategory?.id &&
    !!data.reason?.trim();

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-glass-bg",
        "shadow-md backdrop-blur-xl",
      )}
    >
      <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Appointment Request Details
        </CardTitle>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Fill out your concern category and reason/request first. After this,
          you will be asked to choose your preferred date and preferred time.
        </p>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="space-y-5">
          <SelectField
            label="Concern Category"
            value={data?.appointmentCategory?.id}
            onChange={(id) => {
              onChange(
                "appointmentCategory",
                categories?.find((c) => c.id === Number(id)),
              );
            }}
            options={categories || []}
            loading={isCategoriesLoading}
            required
          />

          <FormField
            value={data.reason}
            onChange={(val) => {
              onChange("reason", val);
            }}
            isTextarea
            placeholder="Briefly explain your concern so the counselor can prepare."
            aria-label="Appointment reason or request"
            label="Reason / Request"
          />

          {showSubmitButton && (
            <div className="flex items-center justify-center pt-2">
              <Button
                onClick={onSubmit}
                disabled={!isFormValid || isSubmitting || isLoading}
                className={cn(
                  "h-11 w-full rounded-xl text-sm font-semibold",
                  "sm:w-auto sm:min-w-72",
                )}
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Appointment Request"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
