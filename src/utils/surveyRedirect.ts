export type EvaluatorRole = 'Student' | 'Admin / Counselor';
export type EvaluatorYearLevel =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year';

export interface EvaluatorContext {
  fullName: string;
  email: string;
  role: EvaluatorRole;
  yearLevel?: EvaluatorYearLevel;
}

const FORM_BASE_URL =
  'https://docs.google.com/forms/d/e/' +
  '1FAIpQLSfa3NridHEU98-aua7X5gxhrFKjZOUS_5hpoN6qaEwdSmp1FA/' +
  'viewform?usp=pp_url';

const ENTRY_NAME = 'entry.1946342474';
const ENTRY_EMAIL = 'entry.857212771';
const ENTRY_ROLE = 'entry.432814322';
const ENTRY_YEAR_LEVEL = 'entry.1652900418';

export const buildUatSurveyUrl = (ctx: EvaluatorContext): string => {
  const params = new URLSearchParams();

  if (ctx.fullName) {
    params.set(ENTRY_NAME, ctx.fullName);
  }
  if (ctx.email) {
    params.set(ENTRY_EMAIL, ctx.email);
  }
  if (ctx.role) {
    params.set(ENTRY_ROLE, ctx.role);
  }
  if (ctx.yearLevel) {
    params.set(ENTRY_YEAR_LEVEL, ctx.yearLevel);
  }

  return `${FORM_BASE_URL}&${params.toString()}`;
};

/**
 * Open UAT Survey
 * Disabled: Evaluator quota already reached.
 */
export const openUatSurvey = (_ctx: EvaluatorContext): void => {
  // Survey quota reached. Redirect intentionally disabled.
};
