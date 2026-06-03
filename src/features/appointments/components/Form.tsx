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
  const isFormValid = data.whenDate && data.timeSlot;

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="rounded-t-md border-b border-border bg-gradient-to-r from-muted/50 to-muted">
        <CardTitle className="text-lg text-foreground">
          Appointment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Reason/Concern Input */}
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
              placeholder="(Optional) Enter your concern or reason for appointment"
              aria-label="Appointment reason or concern"
              label="Reason"
            />
          </div>

          {/* Appointment Summary */}
          {/* {selectedDate && selectedTime && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Appointment Summary:</span>
              </p>
              <p className="text-sm text-foreground/80 mt-1">
                Date: {selectedDate.toDateString()}
              </p>
              <p className="text-sm text-foreground/80">
                Time: {selectedTime?.time}
              </p>
            </div>
          )} */}

          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting || isLoading}
              className={cn(
                "h-auto w-full bg-primary py-3 text-base font-semibold",
                "text-primary-foreground transition-colors hover:bg-primary/90",
                "md:w-1/2",
              )}
            >
              {isSubmitting ? "Scheduling..." : "Confirm Appointment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
