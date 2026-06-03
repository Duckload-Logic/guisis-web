import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import CardBlock from "./CardBlock";
import EmptyState from "./EmptyState";
import SectionTitle from "./SectionTitle";
import TagList from "./TagList";
import { asText } from "../../utils";
import { ActivityOption, Hobby, InterestsSection } from "../../types";

function getActivityOption(activity: any): ActivityOption | undefined {
  if (activity?.activityOption) return activity.activityOption;
  if (Array.isArray(activity?.activityOptions))
    return activity.activityOptions[0];
  return undefined;
}

function getActivityCategory(activity: any) {
  return getActivityOption(activity)?.category?.toLowerCase() || "";
}

export default function InterestsHobbiesView({
  data,
}: {
  data: InterestsSection | undefined;
}) {
  const activities = data?.activities || [];
  const academicInterests = activities.filter((activity: any) =>
    getActivityCategory(activity).includes("academic"),
  );
  const otherActivities = activities.filter(
    (activity: any) => !getActivityCategory(activity).includes("academic"),
  );

  const preferredSubjects = data?.subjectPreferences || [];
  const hobbies = [...(data?.hobbies || [])].sort(
    (a: Hobby, b: Hobby) => (a.priorityRank || 0) - (b.priorityRank || 0),
  );

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-left-4 flex flex-col gap-8",
        "duration-500",
      )}
    >
      <section>
        <SectionTitle title="Activities" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActivityCard
            title="Academic Clubs/Organizations"
            list={academicInterests}
          />
          <ActivityCard
            title="Extracurricular Activities/Organizations"
            list={otherActivities}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="Subject Preferences" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardBlock title="Favorite Subject/s">
            <TagList
              values={preferredSubjects
                .filter((subject: any) => subject.isFavorite)
                .map((subject: any) => subject.subjectName)}
            />
          </CardBlock>
          <CardBlock title="Least Favorite Subject/s">
            <TagList
              values={preferredSubjects
                .filter((subject: any) => !subject.isFavorite)
                .map((subject: any) => subject.subjectName)}
            />
          </CardBlock>
        </div>
      </section>

      <section>
        <SectionTitle title="Hobbies (Priority Rank)" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {hobbies.length > 0 ? (
            hobbies.map((hobby: any, index: number) => (
              <CardBlock
                key={hobby.id || `${hobby.hobbyName}-${index}`}
                title={`Rank ${hobby.priorityRank || index + 1}`}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-card-foreground">
                    {asText(hobby.hobbyName)}
                  </span>
                </div>
              </CardBlock>
            ))
          ) : (
            <EmptyState label="No hobbies recorded" />
          )}
        </div>
      </section>
    </div>
  );
}

function ActivityCard({ title, list }: { title: string; list: any[] }) {
  return (
    <CardBlock title={title}>
      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((activity: any, index: number) => {
            const activityOption = getActivityOption(activity);

            return (
              <div
                key={activity.id || `${title}-${index}`}
                className="rounded-lg border border-glass-border bg-glass-bg p-3"
              >
                <p className="text-xs font-semibold text-card-foreground">
                  {asText(
                    activityOption?.name ||
                      activity.otherSpecification ||
                      "Activity",
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {!title.includes("Academic") &&
                    `Role: ${asText(activity.role)}`}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs italic text-muted-foreground">No records</p>
      )}
    </CardBlock>
  );
}
