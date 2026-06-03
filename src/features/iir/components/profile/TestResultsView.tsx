import { asText } from "@/features/iir/utils";
import { formatDate } from "@/utils/dateTime";
import CardBlock from "./CardBlock";
import EmptyState from "./EmptyState";
import InfoItem from "./InfoItem";
import SectionTitle from "./SectionTitle";
import { TestResult } from "../../types";
import { Clipboard } from "lucide-react";
import { NOT_SPECIFIED } from "../../constants";

export default function TestResultsView({
  data,
}: {
  data: TestResult[] | undefined;
}) {
  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <SectionTitle title="Psychological / Guidance Test Results" />
      <div className="grid grid-cols-1 gap-4">
        {(data?.length ?? 0) > 0 ? (
          data!.map((result: TestResult) => (
            <CardBlock
              key={result.id}
              title={asText(result.testName)}
              icon={Clipboard}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <InfoItem
                  label="Date"
                  value={
                    result.testDate
                      ? formatDate(result.testDate)
                      : NOT_SPECIFIED
                  }
                />
                <InfoItem
                  label="Test Administered"
                  value={asText(result.testName)}
                />
                <InfoItem
                  label="Raw Score"
                  value={asText(result.rawScore)}
                />
                <InfoItem
                  label="Percentile Rank"
                  value={asText(result.percentile)}
                />
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <InfoItem
                  label="Description"
                  value={asText(result.description)}
                />
              </div>
            </CardBlock>
          ))
        ) : (
          <EmptyState label="No test results recorded" />
        )}
      </div>
    </div>
  );
}
