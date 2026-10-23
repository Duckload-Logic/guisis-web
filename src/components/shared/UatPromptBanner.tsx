import React from 'react';
import {
  EvaluatorRole,
  EvaluatorYearLevel,
} from '@/utils/surveyRedirect';

interface UatPromptBannerProps {
  userId: string;
  fullName: string;
  email: string;
  role: EvaluatorRole;
  yearLevel?: EvaluatorYearLevel;
}

/**
 * UatPromptBanner Component
 * Disabled: Evaluator sample size quota reached.
 */
export const UatPromptBanner: React.FC<UatPromptBannerProps> = () => {
  return null;
};
