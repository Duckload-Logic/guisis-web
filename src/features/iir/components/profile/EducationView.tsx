import { asText } from "../../utils";
import { BadgeInfo, BookOpen, School, School2 } from "lucide-react";
import { useMemo } from "react";
import CardBlock from "./CardBlock";
import EmptyState from "./EmptyState";
import InfoItem from "./InfoItem";
import SectionTitle from "./SectionTitle";
import StatCard from "./StatCard";
import { EducationSection, SchoolDetails } from "../../types";
import { cn } from "@/lib/utils";

export default function EducationView({
  data,
}: {
  data: EducationSection | undefined;
}) {
  const schools = useMemo(() => {
    const values = data?.schools || [];
    return [...values].sort(
      (a: SchoolDetails, b: SchoolDetails) =>
        (a.educationalLevel.id || 0) - (b.educationalLevel.id || 0),
    );
  }, [data?.schools]);

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-8 duration-500">
      <section>
        <SectionTitle title="Schooling Overview" />
        <div className="mt-6 flex flex-wrap gap-4">
          <StatCard
            label="Nature of Schooling"
            value={asText(data?.natureOfSchooling)}
            icon={BookOpen}
          />
          {data?.interruptedDetails && (
            <StatCard
              label="Interrupted Details"
              value={asText(data?.interruptedDetails)}
              icon={BadgeInfo}
            />
          )}
          <StatCard
            label="School Records"
            value={asText(schools.length)}
            icon={School}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="Academic History" />
        <div className="relative ml-2 mt-8 space-y-8 border-l-2 border-dashed border-border">
          {schools.length > 0 ? (
            schools.map((school: SchoolDetails) => (
              <div
                key={school.id}
                className="relative pl-8"
              >
                <div
                  className={cn(
                    "absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4",
                    "border-card bg-primary shadow-sm",
                  )}
                />
                <CardBlock
                  icon={School2}
                  title={asText(school.educationalLevel.name)}
                >
                  <div
                    className={cn(
                      "mb-3 flex flex-col gap-2 md:flex-row",
                      "md:items-center md:justify-between",
                    )}
                  >
                    <h4 className="text-sm font-bold text-card-foreground">
                      {asText(school.schoolName)}
                    </h4>
                    <span
                      className={cn(
                        "rounded-full border border-border bg-green-100 px-2",
                        "py-1 text-[10px] font-semibold uppercase",
                        "text-green-800",
                      )}
                    >
                      {asText(school.schoolType)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoItem
                      label="Level"
                      value={asText(school.educationalLevel.name)}
                    />
                    <InfoItem
                      label="Address"
                      value={asText(school.schoolAddress)}
                    />
                    <InfoItem
                      label="Years"
                      value={`${asText(school.yearStarted)} - ${asText(
                        school.yearCompleted,
                      )}`}
                    />
                  </div>
                  <div className="mt-3">
                    <InfoItem
                      label="Awards"
                      value={asText(school.awards)}
                    />
                  </div>
                </CardBlock>
              </div>
            ))
          ) : (
            <EmptyState label="No educational records found" />
          )}
        </div>
      </section>
    </div>
  );
}
