export interface DemographicStat {
  category: string;
  maleCount: number;
  malePct: number;
  femaleCount: number;
  femalePct: number;
  total: number;
  totalPct: number;
}

export interface IIRAnalyticsReportResponse {
  totalStudents: number;
  genderDistribution: DemographicStat[];
  ageDistribution: DemographicStat[];
  civilStatus: DemographicStat[];
  religions: DemographicStat[];
  cityAddress: DemographicStat[];
  monthlyIncome: DemographicStat[];
  ordinalPosition: DemographicStat[];
  fatherEducation: DemographicStat[];
  motherEducation: DemographicStat[];
  parentsMaritalStatus: DemographicStat[];
  highSchoolGWA: DemographicStat[];
  elementary: DemographicStat[];
  highSchool: DemographicStat[];
  juniorHigh: DemographicStat[];
  seniorHigh: DemographicStat[];
  vocational: DemographicStat[];
  college: DemographicStat[];
  natureOfSchooling: DemographicStat[];
  quietStudyPlace: DemographicStat[];
}

export type DashboardResponse = IIRAnalyticsReportResponse;

export interface AnalyticsCourse {
  id: number;
  courseName: string;
}

export interface StudentAnalytics {
  id?: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  religion?: string;
  studentNumber?: string;
  addresses?: any[];
  personalInfo?: {
    highSchoolGWA?: number;
  };
  education?: {
    schools?: any[];
  };
  family?: {
    fatherEducation?: string;
    motherEducation?: string;
    parentMaritalStatus?: string;
    monthlyFamilyIncome?: string;
    relatedPersons?: any[];
  };
}
