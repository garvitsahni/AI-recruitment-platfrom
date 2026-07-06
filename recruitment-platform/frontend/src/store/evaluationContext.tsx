/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobRequirement, Candidate, CandidateStatus, EvaluationRun, FieldWithCitation } from '../types';
import { api } from '../services/api';

interface EvaluationContextType {
  jobs: JobRequirement[];
  currentJob: JobRequirement;
  candidates: Candidate[];
  runs: EvaluationRun[];
  isEvaluating: boolean;
  isUploadingApplications: boolean;
  evaluationStep: number;
  applicationFileName: string | null;
  jdFileName: string | null;
  uploadSummary: string | null;
  selectedCandidateId: string | null;
  selectJob: (jobId: string) => void;
  updateJobRequirements: (updatedJob: JobRequirement) => void;
  markApplicationUploaded: (fileName: string) => void;
  markJdUploaded: (fileName: string) => void;
  importApplications: (file: File) => Promise<void>;
  refreshCandidates: () => Promise<void>;
  startEvaluationPipeline: (onComplete?: () => void) => Promise<void>;
  setSelectedCandidateId: (id: string | null) => void;
  resetDatabase: () => void;
  addRun: (run: EvaluationRun) => void;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

const toField = <T,>(value: T, fileName = 'Imported application', page = 1, snippet = 'Imported from application data'): FieldWithCitation<T> => ({
  value,
  fileName,
  page,
  snippet,
});

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isUploadingApplications, setIsUploadingApplications] = useState<boolean>(false);
  const [evaluationStep, setEvaluationStep] = useState<number>(0);
  const [applicationFileName, setApplicationFileName] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const currentJob = jobs.find(j => j.id === currentJobId) || jobs[0];

  useEffect(() => {
    api.get('/jobs').then((data: any) => {
      const fetchedJobs = data.jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        department: 'Engineering',
        minAge: 21,
        maxAge: 35,
        minExperienceYears: 3,
        qualification: 'B.Tech',
        minPercentage: 60,
        mandatoryDocuments: ['Aadhaar', 'Degree', 'Experience Certificate'],
        rawTextExcerpt: j.description || 'No description available',
        _backendJob: j
      }));
      setJobs(fetchedJobs.length > 0 ? fetchedJobs : [{
        id: 'dummy', title: 'No Jobs Found', department: '', minAge: 0, maxAge: 0, minExperienceYears: 0, qualification: '', minPercentage: 0, mandatoryDocuments: []
      }]);
      if (fetchedJobs.length > 0 && !fetchedJobs.find((j: any) => j.id === currentJobId)) {
        setCurrentJobId(fetchedJobs[0].id);
      }
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRuleKey = (rule: any): keyof Candidate['ruleCompliance']['checks'] => {
    const source = `${rule.category || ''} ${rule.rule || ''}`.toLowerCase();
    if (source.includes('age')) return 'age';
    if (source.includes('qualification') || source.includes('education') || source.includes('degree')) return 'qualification';
    if (source.includes('experience') || source.includes('employment')) return 'experience';
    if (source.includes('mark') || source.includes('percentage')) return 'marks';
    return 'documents';
  };

  const mapRuleStatus = (rule: any): 'PASS' | 'FAIL' => {
    return rule.status === 'passed' && rule.citation_verified !== false ? 'PASS' : 'FAIL';
  };

  const mapApplicationToCandidate = (app: any): Candidate => {
    const matchResult = app.matchResults?.[0];
    const ruleResults = Array.isArray(matchResult?.ruleResults) ? matchResult.ruleResults : [];
    let status: CandidateStatus = 'PENDING';
    if (matchResult) {
      status = matchResult.verdict === 'eligible'
        ? 'ELIGIBLE'
        : matchResult.verdict === 'not_eligible'
          ? 'NOT_ELIGIBLE'
          : 'NEEDS_REVIEW';
    }

    const checks: Candidate['ruleCompliance']['checks'] = {
      age: { status: 'FAIL', required: 'Not checked', actual: 'No verified evidence', message: 'AI evaluation has not verified this rule yet.' },
      qualification: { status: 'FAIL', required: 'Not checked', actual: 'No verified evidence', message: 'AI evaluation has not verified this rule yet.' },
      experience: { status: 'FAIL', required: 'Not checked', actual: 'No verified evidence', message: 'AI evaluation has not verified this rule yet.' },
      marks: { status: 'FAIL', required: 'Not checked', actual: 'No verified evidence', message: 'AI evaluation has not verified this rule yet.' },
      documents: { status: 'FAIL', required: 'Required evidence documents', actual: app.documents?.length ? `${app.documents.length} document(s) uploaded` : 'No documents uploaded', message: 'Document evidence is checked during AI evaluation.' }
    };

    const evidenceValidations: Candidate['evidenceValidation']['validations'] = {};
    const missingDocuments: string[] = [];

    for (const [index, rule] of ruleResults.entries()) {
      const baseKey = getRuleKey(rule);
      const key = checks[baseKey].required === 'Not checked' ? baseKey : `${baseKey}_${index + 1}`;
      const fieldName = String(key);
      const passed = mapRuleStatus(rule);
      const detailMessage = rule.verification_details?.reasoning || rule.verification_details?.error || 'No verification explanation returned.';
      checks[key] = {
        status: passed,
        required: rule.rule,
        actual: rule.value_found || rule.quoted_text || 'No verified claim found',
        message: detailMessage,
      };

      evidenceValidations[key] = {
        fieldName,
        documentExists: rule.status !== 'missing_document',
        pageExists: Boolean(rule.page),
        textMatches: rule.citation_verified === true,
        citedText: rule.quoted_text || '',
        actualTextOnPage: rule.quoted_text || '',
        status: passed,
      };

      if (rule.status === 'missing_document') {
        missingDocuments.push(rule.rule);
      }
    }

    const passedRules = ruleResults.filter((rule: any) => mapRuleStatus(rule) === 'PASS').length;
    const matchScore = matchResult
      ? Math.round((passedRules / Math.max(ruleResults.length, 1)) * 100)
      : 0;

    return {
      id: app.id,
      name: app.candidateName || app.referenceNumber || 'Unknown Candidate',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      matchScore,
      status,
      documents: app.documents?.map((d: any) => ({
        id: d.id,
        fileName: d.fileName,
        category: d.fileType === 'IDENTITY_PROOF' ? 'Identity' : d.fileType === 'ACADEMIC_DOCUMENT' ? 'Academic' : d.fileType === 'EXPERIENCE_CERTIFICATE' ? 'Professional' : 'Supporting',
        exists: true,
        pagesCount: d.pageCount || 1,
        rawTextByPage: { 1: 'Document text is verified by the AI pipeline.' }
      })) || [],
      extractedData: {
        name: toField(app.parsedFormData?.personal_info?.name || app.candidateName || app.referenceNumber || 'Unknown Candidate'),
        dob: toField(app.parsedFormData?.personal_info?.date_of_birth || 'Not extracted'),
        qualification: toField(app.parsedFormData?.education?.[0]?.qualification || 'Not extracted'),
        branch: toField(app.parsedFormData?.education?.[0]?.subject || 'Not extracted'),
        university: toField(app.parsedFormData?.education?.[0]?.board_university || 'Not extracted'),
        passingYear: toField(app.parsedFormData?.education?.[0]?.year_of_passing || 0),
        percentage: toField(Number.parseFloat(app.parsedFormData?.education?.[0]?.percentage_or_cgpa || '0')),
        experienceYears: toField(app.parsedFormData?.work_experience?.[0]?.duration_years || 0),
        employer: toField(app.parsedFormData?.work_experience?.[0]?.organization || 'Not extracted'),
        employmentPeriod: toField(`${app.parsedFormData?.work_experience?.[0]?.from_date || ''} ${app.parsedFormData?.work_experience?.[0]?.to_date || ''}`.trim() || 'Not extracted'),
        skills: toField<string[]>(app.parsedFormData?.technical_skills?.map((skill: any) => skill.skill_name).filter(Boolean) || [])
      },
      evidenceValidation: {
        overallStatus: Object.values(evidenceValidations).every(validation => validation.status === 'PASS') && Object.keys(evidenceValidations).length > 0 ? 'PASS' : 'FAIL',
        validations: evidenceValidations
      },
      ruleCompliance: {
        overallStatus: status === 'ELIGIBLE' ? 'PASS' : 'FAIL',
        checks,
      },
      crossDocumentVerification: [],
      missingDocuments
    };
  };

  const refreshCandidates = async () => {
    if (!currentJobId || currentJobId === 'dummy') {
      setCandidates([]);
      return;
    }

    const data = await api.get(`/jobs/${currentJobId}/applications`);
    const nextCandidates = data.applications.map(mapApplicationToCandidate);
    setCandidates(nextCandidates);
  };

  useEffect(() => {
    refreshCandidates().catch(console.error);
  }, [currentJobId]);

  const selectJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setSelectedCandidateId(null);
  };

  const updateJobRequirements = (updatedJob: JobRequirement) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const addRun = (newRun: EvaluationRun) => {
    setRuns(prevRuns => [newRun, ...prevRuns]);
  };

  const markApplicationUploaded = (fileName: string) => {
    setApplicationFileName(fileName);
    setEvaluationStep(prev => Math.max(prev, 1));
  };

  const markJdUploaded = (fileName: string) => {
    setJdFileName(fileName);
    setEvaluationStep(prev => Math.max(prev, 2));
  };

  const importApplications = async (file: File) => {
    if (!currentJobId || currentJobId === 'dummy') {
      throw new Error('No active job is available for import.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const endpoint = isZip
      ? `/jobs/${currentJobId}/applications/import-zip`
      : `/jobs/${currentJobId}/applications/import`;

    setIsUploadingApplications(true);
    setUploadSummary(null);

    try {
      const data: any = await api.post(endpoint, formData);
      setApplicationFileName(file.name);
      setEvaluationStep(prev => Math.max(prev, 1));
      await refreshCandidates();

      if (isZip) {
        const totalExtracted = data.totalExtracted ?? 0;
        const createdCount = data.createdApplications?.length ?? 0;
        setUploadSummary(
          createdCount > 0
            ? `Imported ${totalExtracted} files from ZIP and created ${createdCount} candidate${createdCount === 1 ? '' : 's'}.`
            : `Imported ${totalExtracted} files from ZIP, but no candidate references were detected.`
        );
        return;
      }

      const processedRows = data.importBatch?.processedRows ?? 0;
      const failedRows = data.importBatch?.failedRows ?? 0;
      setUploadSummary(
        `Imported ${processedRows} candidate${processedRows === 1 ? '' : 's'}${failedRows ? ` with ${failedRows} issue${failedRows === 1 ? '' : 's'}` : ''}.`
      );
    } finally {
      setIsUploadingApplications(false);
    }
  };

  const startEvaluationPipeline = async (_onComplete?: () => void) => {
    if (!currentJobId || currentJobId === 'dummy') {
      throw new Error('No active job is selected.');
    }

    const applicationsData: any = await api.get(`/jobs/${currentJobId}/applications`);
    const applications = applicationsData.applications || [];

    if (applications.length === 0) {
      throw new Error('Upload candidate applications before running AI evaluation.');
    }

    setIsEvaluating(true);
    setEvaluationStep(3);
    setUploadSummary(null);

    try {
      const jobDetails: any = await api.get(`/jobs/${currentJobId}`);
      const job = jobDetails.job;

      if (!job.checklistLocked) {
        const fallbackRules = [
          {
            rule_text: `Candidate must have ${currentJob?.qualification || 'B.Tech'} qualification`,
            rule_type: 'hard',
            category: 'qualification',
            requires_document: true,
            expected_document_type: 'ACADEMIC_DOCUMENT',
          },
          {
            rule_text: `Candidate must have at least ${currentJob?.minExperienceYears || 0} years of experience`,
            rule_type: 'hard',
            category: 'experience',
            requires_document: true,
            expected_document_type: 'EXPERIENCE_CERTIFICATE',
          },
          {
            rule_text: `Candidate must have at least ${currentJob?.minPercentage || 0}% marks`,
            rule_type: 'hard',
            category: 'marks',
            requires_document: true,
            expected_document_type: 'ACADEMIC_DOCUMENT',
          },
        ];
        await api.post(`/jobs/${currentJobId}/lock-checklist`, { rules: fallbackRules });
      }

      await Promise.all(
        applications.map((application: any) => api.post(`/applications/${application.id}/evaluate`, {}))
      );

      await new Promise((resolve) => setTimeout(resolve, 2500));
      await refreshCandidates();
      setEvaluationStep(4);
      setUploadSummary(`AI evaluation started for ${applications.length} candidate${applications.length === 1 ? '' : 's'}. Results will populate automatically.`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetDatabase = () => {
    setJobs([]);
    api.get('/jobs').then((data: any) => setJobs(data.jobs));
    setCandidates([]);
    setRuns([]);
    setEvaluationStep(0);
    setIsEvaluating(false);
    setIsUploadingApplications(false);
    setApplicationFileName(null);
    setJdFileName(null);
    setUploadSummary(null);
    setSelectedCandidateId(null);
  };

  return (
    <EvaluationContext.Provider
      value={{
        jobs,
        currentJob,
        candidates,
        runs,
        isEvaluating,
        isUploadingApplications,
        evaluationStep,
        applicationFileName,
        jdFileName,
        uploadSummary,
        selectedCandidateId,
        selectJob,
        updateJobRequirements,
        markApplicationUploaded,
        markJdUploaded,
        importApplications,
        refreshCandidates,
        startEvaluationPipeline,
        setSelectedCandidateId,
        resetDatabase,
        addRun
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};
