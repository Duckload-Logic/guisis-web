import { Home } from "lucide-react";
import { StudentSection, StudentAddress } from "../../types";
import { asText, renderAddress } from "../../utils";
import { formatDate } from "@/utils/dateTime";
import EmptyState from "./EmptyState";
import SectionTitle from "./SectionTitle";
import CardBlock from "./CardBlock";
import InfoItem from "./InfoItem";
import { NOT_SPECIFIED } from "../../constants";
import { cn } from "@/lib/utils";

export default function PersonalView({
  data,
}: {
  data: StudentSection | undefined;
}) {
  const basicInfo = data?.basicInfo;
  const personalInfo = data?.personalInfo;
  const addresses = data?.addresses || [];

  const personalInfoFields = [
    { label: "First Name", value: asText(basicInfo?.firstName) },
    { label: "Middle Name", value: asText(basicInfo?.middleName) },
    { label: "Last Name", value: asText(basicInfo?.lastName) },
    { label: "Gender", value: asText(personalInfo?.gender?.name) },
    { label: "Civil Status", value: asText(personalInfo?.civilStatus?.name) },
    {
      label: "Religion",
      value:
        personalInfo?.religion?.name === "Others" &&
        personalInfo?.otherReligionText
          ? `Others (${personalInfo.otherReligionText})`
          : asText(personalInfo?.religion?.name),
    },
    { label: "Height (m)", value: asText(personalInfo?.heightM) },
    { label: "Weight (kg)", value: asText(personalInfo?.weightKg) },
    { label: "Complexion", value: asText(personalInfo?.complexion) },
    { label: "High School GWA", value: asText(personalInfo?.highSchoolGWA) },
    { label: "Place of Birth", value: asText(personalInfo?.placeOfBirth) },
    {
      label: "Date of Birth",
      value: personalInfo?.dateOfBirth
        ? formatDate(personalInfo.dateOfBirth)
        : NOT_SPECIFIED,
    },
    {
      label: "Mobile Number",
      value: `${asText(personalInfo?.mobileNumber)}`,
    },
    {
      label: "Telephone Number",
      value: asText(personalInfo?.telephoneNumber),
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle title="Student Identity & Personal Details" />
        <div
          className={cn(
            "mt-6 grid grid-cols-2 gap-x-10 gap-y-6",
            "md:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {personalInfoFields.map((field) => (
            <InfoItem
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Employment Details" />
        {personalInfo?.isEmployed ? (
          <div
            className={cn(
              "mt-6 grid grid-cols-2 gap-x-10 gap-y-6",
              "md:grid-cols-2 lg:grid-cols-3",
            )}
          >
            <InfoItem
              label="Currently Employed"
              value="Yes"
            />
            <InfoItem
              label="Employer Name"
              value={asText(personalInfo?.employerName)}
            />
            <InfoItem
              label="Employer Address"
              value={asText(personalInfo?.employerAddress)}
            />
            <InfoItem
              label="Employer Contact"
              value={asText(personalInfo?.employerContactNumber)}
            />
          </div>
        ) : (
          <div className="mt-6">
            <InfoItem
              label="Currently Employed"
              value="No"
            />
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Residency Details" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses?.length > 0 ? (
            addresses?.map((entry: StudentAddress) => (
              <CardBlock
                icon={Home}
                key={entry?.id}
                title={asText(entry.addressType)}
              >
                <p className="text-xs text-card-foreground">
                  {renderAddress(entry?.address)}
                </p>
              </CardBlock>
            ))
          ) : (
            <EmptyState label="No address records found" />
          )}
        </div>
      </section>
    </div>
  );
}
