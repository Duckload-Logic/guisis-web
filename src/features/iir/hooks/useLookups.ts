/**
 * IIR Lookup Hooks
 * Consolidated lookup hooks using the useLookupWithMeta factory
 * Eliminates duplication and ensures consistent caching
 */

import { useLookupWithMeta } from "@/hooks/useLookup";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";
import { GetIIRLookup } from "../services/service";

/**
 * Fetch courses lookup data
 * @returns Query result with courses data
 */
export function useCourses() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.courses,
    (config) => GetIIRLookup("courses", config),
    "GetIIRLookup",
    "Fetch Courses",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch genders lookup data
 * @returns Query result with genders data
 */
export function useGenders() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.genders,
    (config) => GetIIRLookup("genders", config),
    "GetIIRLookup",
    "Fetch Genders",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch enrollment years lookup data
 * @returns Query result with enrollment years data
 */
export function useEnrollmentYears() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.enrollmentYears,
    (config) => GetIIRLookup("enrollmentYears", config),
    "GetIIRLookup",
    "Fetch Enrollment Years",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch civil statuses lookup data
 * @returns Query result with civil statuses data
 */
export function useCivilStatuses() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.civilStatuses,
    (config) => GetIIRLookup("civilStatuses", config),
    "GetIIRLookup",
    "Fetch Civil Statuses",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch religions lookup data
 * @returns Query result with religions data
 */
export function useReligions() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.religions,
    (config) => GetIIRLookup("religions", config),
    "GetIIRLookup",
    "Fetch Religions",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch parental status types lookup data
 * @returns Query result with parental status types data
 */
export function useParentalStatusTypes() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.parentalStatusTypes,
    (config) => GetIIRLookup("parentalStatusTypes", config),
    "GetIIRLookup",
    "Fetch Parental Status Types",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch enrollment reasons lookup data
 * @returns Query result with enrollment reasons data
 */
export function useEnrollmentReasons() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.enrollmentReasons,
    (config) => GetIIRLookup("enrollmentReasons", config),
    "GetIIRLookup",
    "Fetch Enrollment Reasons",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch income ranges lookup data
 * @returns Query result with income ranges data
 */
export function useIncomeRanges() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.incomeRanges,
    (config) => GetIIRLookup("incomeRanges", config),
    "GetIIRLookup",
    "Fetch Income Ranges",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch student support types lookup data
 * @returns Query result with student support types data
 */
export function useStudentSupportTypes() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.studentSupportTypes,
    (config) => GetIIRLookup("studentSupportTypes", config),
    "GetIIRLookup",
    "Fetch Student Support Types",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch sibling support types lookup data
 * @returns Query result with sibling support types data
 */
export function useSiblingSupportTypes() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.siblingSupportTypes,
    (config) => GetIIRLookup("siblingSupportTypes", config),
    "GetIIRLookup",
    "Fetch Sibling Support Types",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch student relationship types lookup data
 * @returns Query result with student relationship types data
 */
export function useStudentRelationshipTypes() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.studentRelationshipTypes,
    (config) => GetIIRLookup("studentRelationshipTypes", config),
    "GetIIRLookup",
    "Fetch Student Relationship Types",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch nature of residence types lookup data
 * @returns Query result with nature of residence types data
 */
export function useNatureOfResidenceTypes() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.natureOfResidenceTypes,
    (config) => GetIIRLookup("natureOfResidenceTypes", config),
    "GetIIRLookup",
    "Fetch Nature of Residence Types",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch activity options lookup data
 * @returns Query result with activity options data
 */
export function useActivityOptions() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.activityOptions,
    (config) => GetIIRLookup("activityOptions", config),
    "GetIIRLookup",
    "Fetch Activity Options",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch student statuses lookup data
 * @returns Query result with student statuses data
 */
export function useStudentStatuses() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.studentStatuses,
    (config) => GetIIRLookup("studentStatuses", config),
    "GetIIRLookup",
    "Fetch Student Statuses",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}

/**
 * Fetch educational attainments lookup data
 * @returns Query result with educational attainments data
 */
export function useEducationalAttainments() {
  return useLookupWithMeta(
    QUERY_KEYS.iir.lookups.educationalAttainments,
    (config) => GetIIRLookup("educationalAttainments", config),
    "GetIIRLookup",
    "Fetch Educational Attainments",
    { ...CACHE_TIMING.IIR_LOOKUPS },
  );
}
