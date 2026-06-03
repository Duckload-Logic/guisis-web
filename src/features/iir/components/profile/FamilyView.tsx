import { asText, formatCurrency, getOptionLabel } from "../../utils";
import { formatDate } from "@/utils/dateTime";
import {
  BadgeInfo,
  Briefcase,
  CheckCircle2,
  FileText,
  Home,
  User,
  UserRound,
  Users,
} from "lucide-react";
import CardBlock from "./CardBlock";
import EmptyState from "./EmptyState";
import InfoItem from "./InfoItem";
import SectionTitle from "./SectionTitle";
import StatCard from "./StatCard";
import TagList from "./TagList";
import {
  FamilySection,
  RelatedPerson,
  SibilingSupportType,
  StudentSupportType,
} from "../../types";
import { cn } from "@/lib/utils";

export default function FamilyView({
  data,
}: {
  data: FamilySection | undefined;
}) {
  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <section>
        <SectionTitle title="Family Background" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Parental Status"
            value={asText(data?.background?.parentalStatus?.name)}
            icon={Users}
          />
          {data?.background?.parentalStatusDetails && (
            <StatCard
              label="Parental Details"
              value={asText(data?.background?.parentalStatusDetails)}
              icon={FileText}
            />
          )}
          <StatCard
            label="Nature of Residence"
            value={asText(data?.background?.natureOfResidence?.name)}
            icon={Home}
          />
          <StatCard
            label="Brothers"
            value={asText(data?.background?.brothers)}
            icon={UserRound}
          />
          <StatCard
            label="Sisters"
            value={asText(data?.background?.sisters)}
            icon={UserRound}
          />
          <StatCard
            label="Employed Siblings"
            value={asText(data?.background?.employedSiblings)}
            icon={Briefcase}
          />
          <StatCard
            label="Ordinal Position"
            value={asText(data?.background?.ordinalPosition)}
            icon={BadgeInfo}
          />
          <StatCard
            label="Quiet Study Place"
            value={data?.background?.haveQuietPlaceToStudy ? "Yes" : "No"}
            icon={CheckCircle2}
          />
          <StatCard
            label="Sharing Room"
            value={data?.background?.isSharingRoom ? "Yes" : "No"}
            icon={Home}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.background?.isSharingRoom && (
            <CardBlock title="Room Sharing Details">
              <p className="text-xs text-card-foreground">
                {asText(data?.background?.roomSharingDetails)}
              </p>
            </CardBlock>
          )}
          {data?.background?.employedSiblings !== 0 && (
            <CardBlock title="Employed Siblings' Supports">
              <TagList
                values={data!.background!.siblingSupportTypes.map(
                  (item: SibilingSupportType) => getOptionLabel(item.name),
                )}
              />
            </CardBlock>
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="Related Persons" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(data?.relatedPersons?.length ?? 0) > 0 ? (
            data!.relatedPersons.map((person: RelatedPerson) => (
              <CardBlock
                key={person?.id}
                title={asText(person?.relationship?.name)}
                icon={User}
              >
                <div
                  className={cn(
                    "flex flex-col items-start justify-between gap-4",
                    "md:flex-row",
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-card-foreground">
                      {asText(person?.lastName)}, {asText(person?.firstName)}
                      {person?.middleName ? ` ${person?.middleName[0]}.` : ""}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] uppercase",
                        "text-muted-foreground",
                      )}
                    >
                      {asText(person?.relationship?.name)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-start gap-1 md:justify-end">
                    {person.isParent && <RoleBadge label="Parent" />}
                    {person.isGuardian && <RoleBadge label="Guardian" />}
                    <RoleBadge
                      label={person?.isLiving ? "Living" : "Not Living"}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem
                    label="Educational Attainment"
                    value={asText(person?.educationalAttainment?.name)}
                  />
                  <InfoItem
                    label="Birth Date"
                    value={asText(formatDate(person?.dateOfBirth))}
                  />
                  <InfoItem
                    label="Occupation"
                    value={asText(person?.occupation)}
                  />
                  <InfoItem
                    label="Employer"
                    value={asText(person?.employerName)}
                  />
                  <InfoItem
                    label="Employer Address"
                    value={asText(person?.employerAddress)}
                  />
                </div>
              </CardBlock>
            ))
          ) : (
            <EmptyState label="No related persons recorded" />
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="Financial Profile" />
        <div
          className={cn(
            "mt-6 w-full rounded-2xl bg-primary p-6",
            "text-primary-foreground shadow-lg shadow-primary/20",
          )}
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] uppercase opacity-70">
                Monthly Family Income
              </p>
              <p className="text-2xl font-bold">
                {asText(data?.finance?.monthlyFamilyIncomeRange?.text)}
              </p>
              <p className="mt-2 text-xs opacity-90">
                Other Income: {asText(data?.finance?.otherIncomeDetails)}
              </p>
            </div>

            <div className="md:border-l md:border-primary-foreground/20 md:pl-8">
              <p className="mb-1 text-[10px] uppercase opacity-70">
                Weekly Allowance
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.finance?.weeklyAllowance)}
              </p>
            </div>

            <div className="md:border-l md:border-primary-foreground/20 md:pl-8">
              <p className="mb-2 text-[10px] uppercase opacity-70">
                Financial Sources
              </p>
              {(data?.finance?.financialSupportTypes?.length ?? 0) > 0 && (
                <TagList
                  values={data!.finance!.financialSupportTypes.map(
                    (item: StudentSupportType) => getOptionLabel(item?.name),
                  )}
                  dark
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "rounded-full border-2 border-border bg-muted px-2 py-1",
        "text-[10px] text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
