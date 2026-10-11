import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  openUatSurvey,
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

const STORAGE_KEY_PREFIX = 'guisis_uat_completed_';
const BUTTON_TOUCH_TARGET = 'min-h-[44px]';

const BANNER_TITLE = 'Help Us Improve PUPT-GuiSIS';
const BANNER_DESCRIPTION =
  'Please take 3–5 minutes to complete the official ISO 25010 ' +
  'User Acceptance Testing (UAT) evaluation.';
const BUTTON_ALREADY_DONE = 'Already Completed';
const BUTTON_DISMISS = 'Remind Me Later';
const BUTTON_CONFIRM = 'Complete Evaluation';

export const UatPromptBanner: React.FC<UatPromptBannerProps> = ({
  userId,
  fullName,
  email,
  role,
  yearLevel,
}) => {
  const [isDismissed, setIsDismissed] = useState(true);
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  useEffect(() => {
    const hasAnswered = localStorage.getItem(storageKey);
    if (!hasAnswered) {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const markAsCompleted = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  const handleOpenSurvey = () => {
    markAsCompleted();
    openUatSurvey({ fullName, email, role, yearLevel });
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col lg:flex-row items-start lg:items-center
                 justify-between gap-3 rounded-lg border border-primary/20
                 bg-primary/5 p-4 text-sm shadow-sm"
    >
      <div className="text-foreground">
        <p className="font-semibold text-sm">{BANNER_TITLE}</p>
        <p className="text-xs text-muted-foreground">{BANNER_DESCRIPTION}</p>
      </div>

      <div className="flex w-full lg:w-auto flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={markAsCompleted}
          className={`flex-1 sm:flex-initial text-xs ${BUTTON_TOUCH_TARGET}`}
        >
          {BUTTON_ALREADY_DONE}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className={`flex-1 sm:flex-initial text-xs ${BUTTON_TOUCH_TARGET}`}
        >
          {BUTTON_DISMISS}
        </Button>
        <Button
          size="sm"
          onClick={handleOpenSurvey}
          className={`w-full sm:w-auto flex-initial text-xs
                     ${BUTTON_TOUCH_TARGET}`}
        >
          {BUTTON_CONFIRM}
        </Button>
      </div>
    </div>
  );
};
