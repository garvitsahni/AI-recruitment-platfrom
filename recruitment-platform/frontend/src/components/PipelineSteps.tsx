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
    isUploadingApplications,
    evaluationStep,
    applicationFileName,
    jdFileName,
    uploadSummary,
    importApplications,
    markJdUploaded,
    startEvaluationPipeline
  } = useEvaluation();
  const applicationInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (key: UploadKey, file?: File) => {
    setUploadError(null);
    if (!file) return;

    if (key === 'applications') {
      const lowerFileName = file.name.toLowerCase();
      const isZip = lowerFileName.endsWith('.zip');
      const isExcel = lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls');

      if (!isZip && !isExcel) {
        setUploadError('Upload applications as a .zip, .xlsx, or .xls file.');
        return;
      }

      try {
        await importApplications(file);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Application upload failed.');
      }
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Upload the job description as a .pdf file.');
      return;
    }

    markJdUploaded(file.name);
  };

  const handleEvaluation = async () => {
    setUploadError(null);
    try {
      await startEvaluationPipeline();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'AI evaluation failed.');
    }
  };

  const canEvaluate = Boolean(applicationFileName && jdFileName) && !isEvaluating && !isUploadingApplications;

  const StatusLine = ({ complete, running, label }: { complete?: boolean; running?: boolean; label?: string }) => {
    if (!complete && !running) return null;

    return (
      <div className={`flex items-center gap-2 text-sm font-bold mt-6 ${complete ? 'text-success' : 'text-primary'}`}>
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {label || (running ? 'Processing' : 'Verified')}
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

      {uploadSummary && (
        <div className="mb-4 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-xs font-bold text-success">
          {uploadSummary}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => applicationInputRef.current?.click()}
          disabled={isUploadingApplications}
          className="min-h-[260px] text-left rounded-xl border border-border bg-card p-8 flex flex-col items-start transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <input
            ref={applicationInputRef}
            type="file"
            accept=".zip,.xlsx,.xls,application/zip,application/x-zip-compressed,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(event) => {
              void handleFileChange('applications', event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            {isUploadingApplications ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">Upload Applications</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7 break-all">
            {applicationFileName || 'Candidates.zip or Applicants.xlsx'}
          </p>
          <StatusLine
            complete={Boolean(applicationFileName) && !isUploadingApplications}
            running={isUploadingApplications}
            label={isUploadingApplications ? 'Uploading applications' : 'Imported'}
          />
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
            onChange={(event) => {
              void handleFileChange('jd', event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-black text-xl text-foreground">Upload JD</h3>
          <p className="text-sm text-muted font-medium mt-5 leading-7 break-all">
            {jdFileName || 'Job_Description.pdf'}
          </p>
          <StatusLine complete={Boolean(jdFileName)} />
        </button>

        <button
          type="button"
          disabled={!canEvaluate}
          onClick={() => void handleEvaluation()}
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
          <StatusLine running={isEvaluating} complete={evaluationStep >= 4} label={isEvaluating ? 'AI processing' : 'Verified'} />
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
