import React, { useRef, useState } from 'react';
import { Upload, FileText, ScanSearch, Fingerprint, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { useEvaluation } from '../store/evaluationContext';

interface PipelineStepsProps {
  onExportExcel: () => void;
}

type UploadKey = 'applications' | 'jd';

export const PipelineSteps: React.FC<PipelineStepsProps> = ({ onExportExcel }) => {
  const {
    isEvaluating,
    evaluationStep,
    applicationFileName,
    jdFileName,
    markApplicationUploaded,
    markJdUploaded,
    startEvaluationPipeline
  } = useEvaluation();
  const applicationInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (key: UploadKey, file?: File) => {
    setUploadError(null);
    if (!file) return;

    if (key === 'applications' && !file.name.toLowerCase().endsWith('.zip')) {
      setUploadError('Upload applications as a .zip file.');
      return;
    }

    if (key === 'jd' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Upload the job description as a .pdf file.');
      return;
    }

    if (key === 'applications') {
      markApplicationUploaded(file.name);
      return;
    }

    markJdUploaded(file.name);
  };

  const canEvaluate = Boolean(applicationFileName && jdFileName) && !isEvaluating;

  const StatusLine = ({ complete, running }: { complete?: boolean; running?: boolean }) => {
    if (!complete && !running) return null;

    return (
      <div className={`flex items-center gap-2 text-sm font-bold mt-6 ${complete ? 'text-success' : 'text-primary'}`}>
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {running ? 'AI Processing' : 'Verified'}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-8">
        <h2 className="font-serif font-black text-2xl text-foreground tracking-tight">AI Command Center</h2>
        <p className="text-sm text-muted font-medium mt-1">
          Monitor and manage your recruitment evaluation pipeline
        </p>
      </div>

      {uploadError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-xs font-bold text-danger">
          {uploadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => applicationInputRef.current?.click()}
          className="min-h-[260px] text-left rounded-xl border border-border bg-card p-8 flex flex-col items-start transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <input
            ref={applicationInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(event) => handleFileChange('applications', event.target.files?.[0])}
          />
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">Upload Applications</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7">
            {applicationFileName || 'Candidates.zip'}
            <br />
            Applicants.xlsx
          </p>
          <StatusLine complete={Boolean(applicationFileName)} />
        </button>

        <button
          type="button"
          onClick={() => jdInputRef.current?.click()}
          className="min-h-[260px] text-left rounded-xl border border-border bg-card p-8 flex flex-col items-start transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => handleFileChange('jd', event.target.files?.[0])}
          />
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">Upload JD</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7">
            {jdFileName || 'Job_Description.pdf'}
          </p>
          <StatusLine complete={Boolean(jdFileName)} />
        </button>

        <button
          type="button"
          disabled={!canEvaluate}
          onClick={() => startEvaluationPipeline()}
          className="min-h-[260px] text-left rounded-xl border border-primary bg-card p-8 flex flex-col items-start transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            {isEvaluating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanSearch className="w-6 h-6" />}
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">AI Evaluation</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7">
            Matching candidates
            <br />
            Analyzing skills & experience
          </p>
          <StatusLine running={isEvaluating} complete={evaluationStep >= 4} />
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          disabled={evaluationStep < 4 || isEvaluating}
          className="min-h-[260px] text-left rounded-xl border border-border bg-accent p-8 flex flex-col items-start transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <div className="w-14 h-14 rounded-full bg-warning/10 text-muted flex items-center justify-center mb-6">
            <Fingerprint className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">Excel Export</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7">
            Generate final report
            <br />
            with citations
          </p>
          {evaluationStep >= 4 && (
            <div className="flex items-center gap-2 text-sm font-bold mt-6 text-foreground">
              <Clock3 className="w-4 h-4" />
              Ready
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
