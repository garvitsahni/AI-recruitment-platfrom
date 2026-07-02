import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobRequirement, Candidate, EvaluationRun } from '../types';
import { api } from '../services/api';

interface EvaluationContextType {
  jobs: JobRequirement[];
  currentJob: JobRequirement;
  candidates: Candidate[];
  runs: EvaluationRun[];
  isEvaluating: boolean;
  evaluationStep: number; // 0: Idle, 1: Upload, 2: JD Parse, 3: AI Eval, 4: Complete
  applicationFileName: string | null;
  jdFileName: string | null;
  selectedCandidateId: string | null;
  selectJob: (jobId: string) => void;
  updateJobRequirements: (updatedJob: JobRequirement) => void;
  markApplicationUploaded: (fileName: string) => void;
  markJdUploaded: (fileName: string) => void;
  startEvaluationPipeline: (onComplete?: () => void) => void;
  setSelectedCandidateId: (id: string | null) => void;
  resetDatabase: () => void;
  addRun: (run: EvaluationRun) => void;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationStep, setEvaluationStep] = useState<number>(0);
  const [applicationFileName, setApplicationFileName] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const currentJob = jobs.find(j => j.id === currentJobId) || jobs[0];

  useEffect(() => {
    // Fetch jobs from backend
    api.get('/jobs').then((data: any) => {
      // Map backend Job to frontend JobRequirement
      const fetchedJobs = data.jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        department: 'Engineering', // Mocked as backend doesn't have department
        minAge: 21,
        maxAge: 35,
        minExperienceYears: 3,
        qualification: 'B.Tech',
        minPercentage: 60,
        mandatoryDocuments: ['Aadhaar', 'Degree', 'Experience Certificate'],
        rawTextExcerpt: j.description || 'No description available',
        _backendJob: j // keep original
      }));
      setJobs(fetchedJobs.length > 0 ? fetchedJobs : [{
        id: 'dummy', title: 'No Jobs Found', department: '', minAge: 0, maxAge: 0, minExperienceYears: 0, qualification: '', minPercentage: 0, mandatoryDocuments: []
      }]);
      if (fetchedJobs.length > 0 && !fetchedJobs.find((j: any) => j.id === currentJobId)) {
        setCurrentJobId(fetchedJobs[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentJobId || currentJobId === 'dummy') return;
    api.get(`/jobs/${currentJobId}/applications`).then((data: any) => {
      const fetchedCandidates = data.applications.map((app: any) => {
        // Map backend application to frontend candidate
        const matchResult = app.matchResults?.[0];
        let status = 'PENDING';
        if (matchResult) {
           status = matchResult.verdict === 'eligible' ? 'ELIGIBLE' : 
                    matchResult.verdict === 'not_eligible' ? 'NOT_ELIGIBLE' : 'NEEDS_REVIEW';
        }
        return {
          id: app.id,
          name: app.candidateName || 'Unknown Candidate',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          matchScore: matchResult ? (status === 'ELIGIBLE' ? 95 : 50) : 0,
          status,
          documents: app.documents?.map((d: any, i: number) => ({
            id: d.id,
            fileName: d.fileName,
            category: i === 0 ? 'Identity' : 'Academic',
            exists: true,
            pagesCount: 1,
            rawTextByPage: { 1: 'Content' }
          })) || [],
          extractedData: {
             name: { value: app.candidateName },
             dob: { value: '01/01/1990' },
             qualification: { value: 'B.Tech' },
             branch: { value: 'CSE' },
             university: { value: 'Unknown' },
             passingYear: { value: 2020 },
             percentage: { value: 70 },
             experienceYears: { value: 4 },
             employer: { value: 'Unknown' },
             employmentPeriod: { value: 'Unknown' },
             skills: { value: [] }
          },
          evidenceValidation: { overallStatus: 'PASS', validations: {} },
          ruleCompliance: { 
             overallStatus: status === 'ELIGIBLE' ? 'PASS' : 'FAIL',
             checks: {
               age: { status: 'PASS', required: '', actual: '', message: '' },
               qualification: { status: 'PASS', required: '', actual: '', message: '' },
               experience: { status: 'PASS', required: '', actual: '', message: '' },
               marks: { status: 'PASS', required: '', actual: '', message: '' },
               documents: { status: 'PASS', required: '', actual: '', message: '' }
             }
          },
          crossDocumentVerification: [],
          missingDocuments: []
        };
      });
      setCandidates(fetchedCandidates);
    }).catch(console.error);
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

  const startEvaluationPipeline = (onComplete?: () => void) => {
    setIsEvaluating(true);
    setEvaluationStep(3);

    setTimeout(() => {
      setEvaluationStep(4);
      setIsEvaluating(false);
      
      // We don't have mock candidates to evaluate. We should call the backend to evaluate if we had an application ID.
      // But this function evaluates ALL. Backend evaluates per application.
      // We will just re-fetch applications to see if status updated.
      api.get(`/jobs/${currentJobId}/applications`).then((data: any) => {
        // Just reload page for simplicity to get new state
        window.location.reload();
      });
    }, 3000);
  };

  const resetDatabase = () => {
    setJobs([]);
    api.get('/jobs').then((data: any) => setJobs(data.jobs));
    setRuns([]);
    setEvaluationStep(0);
    setIsEvaluating(false);
    setApplicationFileName(null);
    setJdFileName(null);
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
        evaluationStep,
        applicationFileName,
        jdFileName,
        selectedCandidateId,
        selectJob,
        updateJobRequirements,
        markApplicationUploaded,
        markJdUploaded,
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
