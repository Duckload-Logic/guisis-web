import type { RefObject } from "react";

import type { IIRForm as IIRFormType } from "@/features/iir/types";
import {
  EducationSection,
  FamilySection,
  HealthSection,
  InterestsSection,
  PersonalSection,
} from "@/features/iir/components/form";

import { FormSectionSkeleton } from "./FormSectionSkeleton";

interface IIRSectionRendererProps {
  currentSection: number;
  formData: IIRFormType | null;
  isTransitioningStep: boolean;
  isEditMode: boolean;
  personalSectionRef: RefObject<any>;
  educationSectionRef: RefObject<any>;
  familySectionRef: RefObject<any>;
  healthSectionRef: RefObject<any>;
  interestsSectionRef: RefObject<any>;
  onChange: (fieldPath: string, value: any) => void;
  onFieldBlur: (fieldPath: string) => void;
  shouldShowError: (fieldPath: string) => boolean;
}

export function IIRSectionRenderer({
  currentSection,
  formData,
  isTransitioningStep,
  isEditMode,
  personalSectionRef,
  educationSectionRef,
  familySectionRef,
  healthSectionRef,
  interestsSectionRef,
  onChange,
  onFieldBlur,
  shouldShowError,
}: IIRSectionRendererProps) {
  if (isTransitioningStep) return <FormSectionSkeleton />;

  return (
    <>
      {[1, 2, 3, 4].includes(currentSection) && formData?.student && (
        <PersonalSection
          ref={personalSectionRef}
          studentInfo={formData.student}
          onChange={onChange}
          onFieldBlur={onFieldBlur}
          shouldShowError={shouldShowError}
          subStep={currentSection}
          isEditMode={isEditMode}
        />
      )}

      {currentSection === 5 && formData?.education && (
        <EducationSection
          ref={educationSectionRef}
          education={formData.education}
          onChange={onChange}
          onFieldBlur={onFieldBlur}
          shouldShowError={shouldShowError}
        />
      )}

      {[6, 7, 8, 9].includes(currentSection) && formData?.family && (
        <FamilySection
          ref={familySectionRef}
          family={formData.family}
          onChange={onChange}
          onFieldBlur={onFieldBlur}
          shouldShowError={shouldShowError}
          subStep={currentSection - 5}
          isEditMode={isEditMode}
        />
      )}

      {currentSection === 10 && formData?.health && (
        <HealthSection
          ref={healthSectionRef}
          health={formData.health}
          onChange={onChange}
          onFieldBlur={onFieldBlur}
          shouldShowError={shouldShowError}
          isEditMode={isEditMode}
        />
      )}

      {currentSection === 11 && formData?.interests && (
        <InterestsSection
          ref={interestsSectionRef}
          interests={formData.interests}
          onChange={onChange}
          onFieldBlur={onFieldBlur}
          shouldShowError={shouldShowError}
        />
      )}
    </>
  );
}
