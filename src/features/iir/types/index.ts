export interface Gender {
  id: number;
  name?: string;
}

export interface CivilStatus {
  id: number;
  name?: string;
}

export interface Religion {
  id: number;
  name?: string;
}

export interface Program {
  id: number;
  name?: string;
  code?: string;
}

export interface StudentRelationShip {
  id: number;
  name?: string;
}

export interface EducationalLevel {
  id: number;
  name?: string;
}

export interface ParentalStatus {
  id: number;
  name?: string;
}

export interface SibilingSupportType {
  id: number;
  name?: string;
}

export interface ResidenceType {
  id: number;
  name?: string;
}

export interface IncomeRange {
  id: number;
  text?: string;
}

export interface StudentSupportType {
  id: number;
  name?: string;
}

export interface ActivityOption {
  id: number;
  name?: string;
  category?: string;
  isAcademic?: boolean;
}

export interface StudentStatus {
  id: number;
  name: string;
}

export interface SubjectPreference {
  id?: number;
  subjectName: string;
  isFavorite: boolean;
}

export interface Hobby {
  id?: number;
  hobbyName: string;
  priorityRank: number;
}

export interface Region {
  id?: number;
  code: string;
  name?: string;
}

export interface Province {
  id?: number;
  code: string;
  name?: string;
  regionCode?: string;
}

export interface City {
  id?: number;
  code: string;
  name?: string;
  provinceCode?: string;
  regionCode?: string;
}

export interface Barangay {
  id?: number;
  code: string;
  name?: string;
  cityCode?: string;
}

export interface Address {
  id?: number;
  region: Region;
  province: Province | null;
  city: City;
  barangay: Barangay;
  streetDetail: string;
}

export interface StudentAddress {
  id?: number;
  addressType: string;
  address: Address;
}

export interface BasicInfo {
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
}

export interface EmergencyContact {
  id?: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  contactNumber: string;
  relationship: StudentRelationShip;
  address: Address;
}

export interface PersonalInfo {
  id?: number;
  suffix: string;
  twoByTwoPhotoDataUrl?: string | null;
  studentNumber: string;
  gender: Gender;
  civilStatus: CivilStatus;
  religion: Religion;
  otherReligionText?: string;
  heightM: string;
  weightKg: string;
  complexion: string;
  highSchoolGWA: string;
  program: Program;
  yearLevel: number;
  section: string;
  dateOfBirth: string;
  placeOfBirth: string;
  mobileNumber: string;
  telephoneNumber: string | null;
  isEmployed: boolean;
  employerName: string | null;
  employerAddress: string | null;
  employerContactNumber: string | null;

  emergencyContact: EmergencyContact;
}

export interface SchoolDetails {
  id?: number;
  educationalLevel: EducationalLevel;
  schoolName: string;
  schoolAddress: string;
  schoolType: string;
  yearStarted: string;
  yearCompleted: string;
  awards: string;
}

export interface FamilyBackground {
  id?: number;
  parentalStatus: ParentalStatus;
  parentalStatusDetails: string | null;
  brothers: number;
  sisters: number;
  employedSiblings: number;
  ordinalPosition: number;
  haveQuietPlaceToStudy: boolean;
  siblingSupportTypes: SibilingSupportType[];
  isSharingRoom: boolean;
  roomSharingDetails: string | null;
  natureOfResidence: ResidenceType;
}

export interface RelatedPerson {
  id?: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  educationalAttainment: EducationalLevel;
  occupation: string | null;
  employerName: string | null;
  employerAddress: string | null;
  relationship: StudentRelationShip;
  isParent: boolean;
  isGuardian: boolean;
  isLiving: boolean;
}

export interface FinancialInfo {
  id?: number;
  monthlyFamilyIncomeRange: IncomeRange;
  otherIncomeDetails: string | null;
  financialSupportTypes: StudentSupportType[];
  weeklyAllowance: string;
}

export interface HealthRecord {
  id?: number;
  visionHasProblem: boolean;
  visionDetails: string | null;
  hearingHasProblem: boolean;
  hearingDetails: string | null;
  speechHasProblem: boolean;
  speechDetails: string | null;
  generalHealthHasProblem: boolean;
  generalHealthDetails: string | null;
  mentalEmotionalHasProblem: boolean;
  mentalEmotionalDetails: string | null;
}

export interface ConsultationRecord {
  id?: number;
  professionalType: string;
  hasConsulted: boolean;
  whenDate: string | null;
  forWhat: string | null;
}

export interface Activity {
  id?: number;
  activityOption: ActivityOption;
  otherSpecification: string | null;
  role: string;
  roleSpecification: string | null;
}

export interface TestResult {
  id?: number;
  testDate: string;
  testName: string;
  rawScore: string;
  percentile: string;
  description: string;
}

export interface SignificantNote {
  id?: number;
  iirId?: string;
  note: string;
  remarks: string;
  appointmentId?: number;
  admissionSlipId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteRequest {
  note: string;
  remarks: string;
  appointmentId?: number;
  admissionSlipId?: number;
}

export interface StudentSection {
  basicInfo: BasicInfo;
  personalInfo: PersonalInfo;
  addresses: StudentAddress[];
  studentCorUrl?: string;
}

export interface EducationSection {
  id?: number;
  natureOfSchooling: string;
  interruptedDetails: string | null;
  schools: SchoolDetails[];
}

export interface FamilySection {
  background: FamilyBackground;
  relatedPersons: RelatedPerson[];
  finance: FinancialInfo;
}

export interface HealthSection {
  healthRecord: HealthRecord;
  consultations: ConsultationRecord[];
}

export interface InterestsSection {
  activities: Activity[];
  subjectPreferences: SubjectPreference[];
  hobbies: Hobby[];
}

export interface IIRForm {
  id?: string;
  student: StudentSection;
  education: EducationSection;
  family: FamilySection;
  health: HealthSection;
  interests: InterestsSection;
  isCompleted?: boolean;
}

export const ORDER_BY_OPTIONS: { [key: string]: string } = {
  firstName: "first_name",
  lastName: "last_name",
  studentId: "student_number",
  programId: "program_id",
  yearLevel: "year_level",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export type QueryParam = {
  page?: number;
  pageSize?: number;
  search?: string;
  programId?: number;
  genderId?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  yearLevel?: number;
  statusId?: number;
};

export interface StudentFilterCount {
  id: number;
  name: string;
  code?: string;
  count: number;
}

export interface StudentFilterCounts {
  statuses: StudentFilterCount[];
  programs: StudentFilterCount[];
  yearLevels: StudentFilterCount[];
}

export interface StudentListResponse {
  students: IIRProfileView[];
  total?: number;
  meta: {
    total: number;
    page: number;
    pagesSize: number;
    totalPages: number;
  };
  filterCounts: StudentFilterCounts;
}

export interface IIRProfileView {
  iirId: string;
  userId: string;
  studentNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  gender: {
    id: number;
    name: string;
  };
  email: string;
  profilePicture?: string;
  program: {
    id: number;
    name: string;
    code: string;
  };
  yearLevel: number;
  status: StudentStatus;
  studentCorUrl?: string;
  isCompleted: boolean;
}
