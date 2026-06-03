import React from "react";
import { TabId } from "../../constants";
import PersonalView from "./PersonalView";
import EducationView from "./EducationView";
import FamilyView from "./FamilyView";
import HealthView from "./HealthView";
import InterestsHobbiesView from "./InterestsView";
import TestResultsView from "./TestResultsView";
import NotesView from "./NotesView";
import { cn } from "@/lib/utils";

export default function InfoContent({
  activeTab,
  studentData,
  showSignificantNotes = true,
  iirId,
}: {
  activeTab: TabId;
  studentData: any;
  showSignificantNotes?: boolean;
  iirId?: string;
}) {
  const views: Record<TabId, React.JSX.Element> = {
    personal: <PersonalView data={studentData?.student} />,
    education: <EducationView data={studentData?.education} />,
    family: <FamilyView data={studentData?.family} />,
    health: <HealthView data={studentData?.health} />,
    interests: <InterestsHobbiesView data={studentData?.interests} />,
    testResults: <TestResultsView data={studentData?.testResults} />,
    ...(showSignificantNotes && {
      significantNotes: (
        <NotesView
          data={studentData?.significantNotes}
          iirId={iirId}
        />
      ),
    }),
  } as Record<TabId, React.JSX.Element>;

  return (
    <div
      className={cn(
        "z-10 mb-4 min-h-[500px] w-full rounded-b-xl border-2",
        "border-glass-border bg-card p-4 shadow-md sm:rounded-t-xl",
        "sm:p-6",
      )}
    >
      {views[activeTab]}
    </div>
  );
}
