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
        "overflow-hidden rounded-[26px] border border-white/25 bg-white/55",
        "shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl",
        "dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <CardHeader className="border-b border-white/20 bg-white/25 px-4 py-4 dark:border-white/10 dark:bg-white/[0.025] sm:px-6 sm:py-5">
        <CardTitle className="text-xl font-semibold text-foreground">
          Appointment Request Details
        </CardTitle>

        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Fill out your concern category and reason/request first. After this,
          you will be asked to choose your preferred date and preferred time.
        </p>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-5">
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
                  "h-auto w-full rounded-xl bg-primary py-3 text-base font-semibold",
                  "text-primary-foreground transition-colors hover:bg-primary/90",
                  "md:w-1/2",
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