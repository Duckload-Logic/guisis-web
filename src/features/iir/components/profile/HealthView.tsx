import {
  Activity,
  CheckCircle2,
  Ear,
  Eye,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { asText } from "../../utils";
import { formatDate } from "@/utils/dateTime";
import EmptyState from "./EmptyState";
import InfoItem from "./InfoItem";
import SectionTitle from "./SectionTitle";
import { ConsultationRecord, HealthSection } from "../../types";
import { NOT_SPECIFIED } from "../../constants";
import { cn } from "@/lib/utils";

export default function HealthView({
  data,
}: {
  data: HealthSection | undefined;
}) {
  const physicalStats = [
    {
      label: "Vision",
      value: data?.healthRecord?.visionHasProblem,
      details: data?.healthRecord?.visionDetails,
      icon: Eye,
    },
    {
      label: "Hearing",
      value: data?.healthRecord?.hearingHasProblem,
      details: data?.healthRecord?.hearingDetails,
      icon: Ear,
    },
    {
      label: "Speech",
      value: data?.healthRecord?.speechHasProblem,
      details: data?.healthRecord?.speechDetails,
      icon: MessageSquare,
    },
    {
      label: "General Health",
      value: data?.healthRecord?.generalHealthHasProblem,
      details: data?.healthRecord?.generalHealthDetails,
      icon: Activity,
    },
  ];

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-right-4",
        "space-y-8 duration-500",
      )}
    >
      <section>
        <SectionTitle title="Health Remarks" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {physicalStats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border border-glass-border bg-glass-bg p-4",
                "h-fit shadow-sm transition-shadow hover:shadow-lg",
              )}
            >
              <div className="mb-3 flex min-h-[62px] items-center gap-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <stat.icon size={18} />
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase",
                    "text-muted-foreground",
                  )}
                >
                  {stat.label}
                </span>
              </div>
              <StatusPill value={stat.value} />
              <div
                className={cn(
                  "mt-3 border-t border-border pt-3 text-xs",
                  "text-muted-foreground",
                )}
              >
                {asText(stat.details)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Professional Consultation" />
        <div className="mt-6 grid grid-cols-1 gap-4">
          {(data?.consultations?.length ?? 0) > 0 ? (
            data?.consultations.map((consultation: ConsultationRecord) => (
              <div
                key={consultation.id}
                className="rounded-2xl border border-primary/50 bg-primary/5 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-card-foreground">
                    {asText(consultation.professionalType)}
                  </h4>
                  {consultation.hasConsulted ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold",
                        "text-green-700",
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Consulted
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold",
                        "text-muted-foreground",
                      )}
                    >
                      <XCircle className="h-4 w-4" /> Not Consulted
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem
                    label="When"
                    value={
                      consultation.whenDate
                        ? formatDate(consultation.whenDate)
                        : NOT_SPECIFIED
                    }
                  />
                  <InfoItem
                    label="Reason"
                    value={asText(consultation.forWhat)}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="No consultations recorded" />
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ value }: { value: boolean | null | undefined }) {
  if (value === undefined || value === null) {
    return (
      <div className="w-fit rounded border px-2 py-1 text-xs font-bold">
        {NOT_SPECIFIED}
      </div>
    );
  }

  return value ? (
    <div
      className={cn(
        "w-fit rounded border border-amber-700 px-2 py-1 text-xs",
        "font-bold text-amber-700",
      )}
    >
      Has Problem
    </div>
  ) : (
    <div
      className={cn(
        "w-fit rounded border border-green-700 px-2 py-1 text-xs",
        "font-bold text-green-700",
      )}
    >
      No Problem
    </div>
  );
}
