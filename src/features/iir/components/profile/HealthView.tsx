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

  const professionalTypes = ["Psychiatrist", "Psychologist", "Counselor"];

  const groupedConsultations = professionalTypes.map((type) => {
    const consultations = Array.isArray(data?.consultations)
      ? data.consultations.filter(
          (c: ConsultationRecord) => asText(c.professionalType) === type,
        )
      : [];

    const hasYes = consultations.some(
      (c: ConsultationRecord) => c.hasConsulted === true,
    );
    const hasNo = consultations.some(
      (c: ConsultationRecord) => c.hasConsulted === false,
    );
    const yesSessions = consultations
      .filter((c: ConsultationRecord) => c.hasConsulted === true)
      .sort((a, b) => {
        const dateA = a.whenDate || "";
        const dateB = b.whenDate || "";
        return dateA.localeCompare(dateB);
      });

    return {
      type,
      hasConsulted: hasYes ? true : hasNo ? false : null,
      sessions: yesSessions,
    };
  });

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
        <div className="mt-6 grid grid-cols-1 gap-6">
          {groupedConsultations.map((group) => (
            <div
              key={group.type}
              className={cn(
                "rounded-2xl border bg-glass-bg/5 p-5 transition-all",
                group.hasConsulted
                  ? "border-primary/50 bg-primary/5"
                  : "border-glass-border/40",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-card-foreground">
                  {group.type}
                </h4>
                {group.hasConsulted === true ? (
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

              {group.hasConsulted === true && group.sessions.length > 0 && (
                <div className="mt-4 space-y-4">
                  {group.sessions.map((session, idx) => (
                    <div
                      key={session.id || idx}
                      className={cn(
                        "grid grid-cols-1 gap-4 md:grid-cols-2 pt-4",
                        idx > 0 && "border-t border-glass-border/20",
                      )}
                    >
                      <InfoItem
                        label="When"
                        value={
                          session.whenDate
                            ? formatDate(session.whenDate)
                            : NOT_SPECIFIED
                        }
                      />
                      <InfoItem
                        label="Reason"
                        value={asText(session.forWhat)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
