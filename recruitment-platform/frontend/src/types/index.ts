export interface JobRequirement {
  id: string;
  title: string;
  department: string;
  minAge: number;
  maxAge: number;
  minExperienceYears: number;
  qualification: string;
  minPercentage: number;
  mandatoryDocuments: string[]; // e.g. ['Aadhaar', 'Degree', 'Experience Certificate']
  rawTextExcerpt?: string; // JD raw text showing where requirement comes from
}

export interface FieldWithCitation<T> {
  value: T;
  fileName: string;
  page: number;
  snippet: string; // The exact text cited
}

export interface ExtractedData {
  name: FieldWithCitation<string>;
  dob: FieldWithCitation<string>;
  qualification: FieldWithCitation<string>;
  branch: FieldWithCitation<string>;
  university: FieldWithCitation<string>;
  passingYear: FieldWithCitation<number>;
  percentage: FieldWithCitation<number>;
  experienceYears: FieldWithCitation<number>;
  employer: FieldWithCitation<string>;
  employmentPeriod: FieldWithCitation<string>;
  skills: FieldWithCitation<string[]>;
}

export interface CandidateDocument {
  id: string;
  fileName: string;
  category: 'Identity' | 'Academic' | 'Professional' | 'Supporting';
  exists: boolean;
  pagesCount: number;
  rawTextByPage: { [pageNumber: number]: string };
}

export interface FieldValidation {
  fieldName: string;
  documentExists: boolean;
  pageExists: boolean;
  textMatches: boolean;
  citedText: string;
  actualTextOnPage: string;
  status: 'PASS' | 'FAIL';
}

export interface EvidenceValidationResults {
  overallStatus: 'PASS' | 'FAIL';
  validations: { [fieldName: string]: FieldValidation };
}

export interface ComplianceCheck {
  status: 'PASS' | 'FAIL';
  required: string;
  actual: string;
  message: string;
}

export interface RuleComplianceResults {
  overallStatus: 'PASS' | 'FAIL';
  checks: {
    age: ComplianceCheck;
    qualification: ComplianceCheck;
    experience: ComplianceCheck;
    marks: ComplianceCheck;
    documents: ComplianceCheck;
    [ruleKey: string]: ComplianceCheck;
  };
}

export interface Inconsistency {
  id: string;
  field: string; // e.g. "Date of Birth"
  sourceA: string; // e.g. "Resume.pdf (Page 1)"
  valueA: string;
  sourceB: string; // e.g. "Aadhaar.pdf (Page 1)"
  valueB: string;
  severity: 'HIGH' | 'MEDIUM';
  message: string;
}

export type CandidateStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_REVIEW' | 'PENDING';

export interface Candidate {
  id: string;
  name: string;
  avatarUrl: string;
  matchScore: number; // overall percentage match index
  status: CandidateStatus;
  documents: CandidateDocument[];
  extractedData: ExtractedData;
  evidenceValidation: EvidenceValidationResults;
  ruleCompliance: RuleComplianceResults;
  crossDocumentVerification: Inconsistency[];
  missingDocuments: string[];
}

export interface EvaluationRun {
  id: string;
  jobId: string;
  date: string;
  totalCandidates: number;
  eligibleCount: number;
  reviewCount: number;
  notEligibleCount: number;
  status: 'Running' | 'Completed' | 'Failed';
  currentStep: number; // 1 to 4
}
