import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment } from "../types";
import { Dropdown } from "@/components/form";
import { useCategories } from "../hooks";
import { FormInput } from "@/components/form";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  data: Appointment;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
}

export default function AppointmentForm({
  data,
  onChange,
  onSubmit,
  isLoading,
  isSubmitting,
}: AppointmentFormProps) {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const isFormValid =
    data.whenDate && data.timeSlot?.id && data.appointmentCategory?.id;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-white/25 bg-white/45",
        "shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <CardHeader className="border-b border-white/20 bg-white/20 px-5 py-4 dark:border-white/10 dark:bg-white/[0.025]">
        <CardTitle className="text-lg text-foreground">
          Appointment Request Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete the details below before submitting your preferred schedule.
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <Dropdown
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

            <FormInput
              value={data.reason}
              onChange={(val) => {
                onChange("reason", val);
              }}
              isTextarea
              placeholder="Optional: briefly explain your concern so the counselor can prepare."
              aria-label="Appointment reason or concern"
              label="Reason"
            />
          </div>

          <div
            className={cn(
              "rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3",
              "text-sm leading-6 text-primary",
            )}
          >
            Your preferred schedule will be reviewed by the Guidance Office. It
            is not automatically confirmed after submission.
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting || isLoading}
              className={cn(
                "h-auto w-full rounded-xl bg-primary py-3 text-base font-semibold",
                "text-primary-foreground transition-colors hover:bg-primary/90",
                "md:w-1/2",
              )}
            >
              {isSubmitting ? "Submitting..." : "Submit Appointment Request"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}