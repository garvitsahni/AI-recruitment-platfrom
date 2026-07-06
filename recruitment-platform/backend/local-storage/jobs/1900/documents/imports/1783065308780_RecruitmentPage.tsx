import React, { useState } from 'react';
import { useEvaluation } from '../../store/evaluationContext';
import { FileText, Save, CheckCircle, HelpCircle, Edit2, AlertCircle } from 'lucide-react';

export const RecruitmentPage: React.FC = () => {
  const { currentJob, updateJobRequirements } = useEvaluation();
  const [minAge, setMinAge] = useState(currentJob.minAge);
  const [maxAge, setMaxAge] = useState(currentJob.maxAge);
  const [minExperience, setMinExperience] = useState(currentJob.minExperienceYears);
  const [qualification, setQualification] = useState(currentJob.qualification);
  const [minPercentage, setMinPercentage] = useState(currentJob.minPercentage);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateJobRequirements({
      ...currentJob,
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      minExperienceYears: Number(minExperience),
      qualification,
      minPercentage: Number(minPercentage),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-foreground tracking-tight">Step 1 — Requirement Extraction Engine</h1>
        <p className="text-xs text-muted font-medium mt-1">
          Gemini parses official PDFs to establish the structured compliance rule framework.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Recruitment Notification Text (simulating the source PDF) */}
        <div className="xl:col-span-6 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Source Document (PDF)</h2>
          </div>
          <p className="text-xs text-muted font-medium mb-4">
            Official recruitment circular uploaded to the pipeline. Text below is parsed directly from the file.
          </p>

          <div className="flex-1 bg-slate-500/5 dark:bg-slate-900/50 p-5 rounded-2xl border border-border h-[480px] overflow-y-auto select-text">
            <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {currentJob.rawTextExcerpt}
            </pre>
          </div>
          
          <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-[10px] text-muted leading-relaxed font-semibold">
              <strong className="text-foreground">Audit Traceability Note:</strong> Gemini scans the document text above and generates the JSON compliance schema shown on the right.
            </span>
          </div>
        </div>

        {/* Right Side: Structured Eligibility Framework Editor */}
        <div className="xl:col-span-6 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Extracted Rules Framework</h2>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-success/15 text-success rounded-full">
                ACTIVE SCHEMA
              </span>
            </div>
            
            <p className="text-xs text-muted font-medium mb-6">
              Review and customize the rule benchmarks. Updating these values will instantly re-evaluate candidates against the new criteria.
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Job Title (Locked) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted select-none">
                  Recruitment Position
                </label>
                <input 
                  type="text" 
                  value={currentJob.title} 
                  disabled 
                  className="bg-accent/40 border border-border/80 text-muted-foreground text-xs font-bold p-3.5 rounded-2xl w-full select-none cursor-not-allowed"
                />
              </div>

              {/* Age Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Min Age Requirement
                  </label>
                  <input 
                    type="number" 
                    value={minAge} 
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Max Age Limit
                  </label>
                  <input 
                    type="number" 
                    value={maxAge} 
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Educational Degree */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Required Educational Degree
                </label>
                <input 
                  type="text" 
                  value={qualification} 
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.Tech, M.Tech, MCA"
                  className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Marks & Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Min Marks Cutoff (%)
                  </label>
                  <input 
                    type="number" 
                    value={minPercentage} 
                    onChange={(e) => setMinPercentage(Number(e.target.value))}
                    className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Min Experience (Years)
                  </label>
                  <input 
                    type="number" 
                    value={minExperience} 
                    onChange={(e) => setMinExperience(Number(e.target.value))}
                    className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Mandatory Documents */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted select-none">
                  Mandatory Document Checklists (Locked)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {currentJob.mandatoryDocuments.map((doc, idx) => (
                    <span 
                      key={idx} 
                      className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]"
                    >
                      {doc} Card / Certificate
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-primary/10 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save & Apply Rules
                </button>
              </div>
            </form>
          </div>

          {/* Success Status banner */}
          {isSaved && (
            <div className="mt-4 p-3 bg-success/15 border border-success/20 text-success rounded-xl flex items-center gap-2 text-xs font-bold justify-center animate-fade">
              <CheckCircle className="w-4.5 h-4.5" />
              Rules updated! Candidate profiles re-evaluated.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default RecruitmentPage;
