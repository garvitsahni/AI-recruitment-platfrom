import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../../store/evaluationContext';
import { DocumentViewer } from '../../components/DocumentViewer';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  CheckSquare, 
  Scale, 
  Compass, 
  Printer, 
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CandidatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidates, currentJob } = useEvaluation();
  const [activeTab, setActiveTab] = useState<'audit' | 'documents'>('audit');

  const candidate = candidates.find(c => c.id === id);

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-3xl text-center">
        <AlertTriangle className="w-12 h-12 text-warning mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-foreground mb-2">Candidate Not Found</h2>
        <p className="text-xs text-muted font-semibold mb-6">The candidate ID you are searching for is invalid.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs py-3 px-6 rounded-2xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const statusColors = {
    ELIGIBLE: 'bg-success/10 text-success border-success/20',
    NOT_ELIGIBLE: 'bg-danger/10 text-danger border-danger/20',
    NEEDS_REVIEW: 'bg-warning/10 text-warning border-warning/20',
    PENDING: 'bg-accent text-muted border-border'
  }[candidate.status];

  return (
    <div className="flex flex-col gap-8 print:p-0">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 print:hidden">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 border border-border bg-card hover:bg-accent text-foreground transition-all text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Audit Report
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4.5 z-10">
          <img 
            src={candidate.avatarUrl} 
            alt={candidate.name} 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-border shadow-sm"
          />
          <div>
            <h1 className="font-black text-2xl text-foreground tracking-tight">{candidate.name}</h1>
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase">{currentJob.title}</span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span className="text-[10px] text-muted font-bold">ID: {candidate.id.toUpperCase()}</span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColors}`}>
                {candidate.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Match score circles */}
        <div className="flex items-center gap-4.5 z-10">
          <div className="flex flex-col items-end">
            <span className="font-black text-3xl text-foreground">{candidate.matchScore}%</span>
            <span className="text-[10px] text-muted font-bold tracking-wider uppercase mt-0.5">Eligibility Index</span>
          </div>
          <div className="w-px h-12 bg-border"></div>
          <div className="flex flex-col gap-1 text-[11px] text-muted font-semibold leading-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              <span>Citations Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${candidate.crossDocumentVerification.length > 0 ? 'bg-warning animate-ping' : 'bg-success'}`}></span>
              <span>{candidate.crossDocumentVerification.length === 0 ? 'No Contradictions' : 'Inconsistencies Flagged'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'audit' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Compliance Audit Report
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'documents' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Interactive Document Viewer
        </button>
      </div>

      {/* TAB CONTENT: Compliance Audit details */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-8">
          
          {/* Inconsistencies Banner (Step 6 Cross-Document Engine) */}
          {candidate.crossDocumentVerification.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-3xl p-6 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Step 6 — Cross-Document Verification Anomalies</h3>
              </div>
              <p className="text-xs text-muted font-medium leading-relaxed">
                The cross-document engine analyzed and cross-referenced all candidate records. The following contradiction was flagged and requires manual HR review before processing final eligibility stamps.
              </p>
              <div className="flex flex-col gap-2">
                {candidate.crossDocumentVerification.map((inc) => (
                  <div key={inc.id} className="p-4 bg-card border border-warning/25 rounded-2xl flex flex-col gap-2 shadow-sm text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-warning uppercase tracking-wider text-[10px]">Contradiction: {inc.field}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${inc.severity === 'HIGH' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {inc.severity} SEVERITY
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 font-semibold leading-relaxed">
                      <div className="p-3 bg-slate-500/5 rounded-xl border border-border">
                        <span className="text-[10px] text-muted block">Source A: {inc.sourceA}</span>
                        <span className="text-foreground font-bold mt-1 block">{inc.valueA}</span>
                      </div>
                      <div className="p-3 bg-slate-500/5 rounded-xl border border-border">
                        <span className="text-[10px] text-muted block">Source B: {inc.sourceB}</span>
                        <span className="text-foreground font-bold mt-1 block">{inc.valueB}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-semibold mt-1">
                      <strong className="text-foreground font-bold">Engine Insight:</strong> {inc.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Documents Alert */}
          {candidate.missingDocuments.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-3xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Step 2 — Missing Document Warning</h3>
              </div>
              <p className="text-xs text-muted font-medium leading-relaxed">
                The candidate document parser failed to identify mandatory files in the zipped directory folder:
              </p>
              <div className="flex gap-2">
                {candidate.missingDocuments.map((doc, idx) => (
                  <span key={idx} className="bg-danger/15 text-danger font-extrabold text-[10px] px-3.5 py-1.5 border border-danger/25 rounded-xl">
                    Missing: {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 Rule Compliance Grid */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Step 5 — Rule Compliance Engine Audit</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3.5 text-left font-bold text-muted uppercase tracking-wider">Verification Rule</th>
                    <th className="py-3.5 text-left font-bold text-muted uppercase tracking-wider">Required Benchmark</th>
                    <th className="py-3.5 text-left font-bold text-muted uppercase tracking-wider">Extracted & Verified Claim</th>
                    <th className="py-3.5 text-left font-bold text-muted uppercase tracking-wider">Status</th>
                    <th className="py-3.5 text-left font-bold text-muted uppercase tracking-wider">Audit Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(candidate.ruleCompliance.checks).map(([key, check]) => {
                    const iconMap = {
                      age: <Calendar className="w-4 h-4 text-muted shrink-0" />,
                      qualification: <GraduationCap className="w-4 h-4 text-muted shrink-0" />,
                      experience: <Briefcase className="w-4 h-4 text-muted shrink-0" />,
                      marks: <CheckSquare className="w-4 h-4 text-muted shrink-0" />,
                      documents: <FileText className="w-4 h-4 text-muted shrink-0" />
                    }[key];

                    return (
                      <tr key={key} className="hover:bg-slate-500/2 transition-colors">
                        <td className="py-4 font-bold text-foreground flex items-center gap-2.5">
                          {iconMap}
                          <span className="capitalize">{key}</span>
                        </td>
                        <td className="py-4 font-bold text-muted">{check.required}</td>
                        <td className="py-4 font-extrabold text-foreground">{check.actual}</td>
                        <td className="py-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            check.status === 'PASS' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {check.status}
                          </span>
                        </td>
                        <td className="py-4 text-muted font-medium max-w-[280px] leading-relaxed">{check.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 7 Printable audit sheet */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col gap-6 relative border-t-4 border-t-primary">
            {/* Stamp logo on print sheet */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest block mb-1">
                  RecruitAI Compliance Bureau
                </span>
                <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Final Eligibility Report</h2>
                <span className="text-[10px] text-muted font-medium">Evaluation Date: 2026-07-01 (10:25 AM)</span>
              </div>
              <div className={`p-4 rounded-2xl border-4 text-center select-none rotate-3 font-black text-sm ${
                candidate.status === 'ELIGIBLE' 
                  ? 'border-success/35 text-success/75 bg-success/5' 
                  : candidate.status === 'NEEDS_REVIEW' 
                    ? 'border-warning/35 text-warning/75 bg-warning/5' 
                    : 'border-danger/35 text-danger/75 bg-danger/5'
              }`}>
                {candidate.status === 'ELIGIBLE' 
                  ? 'COMPLIANT' 
                  : candidate.status === 'NEEDS_REVIEW' 
                    ? 'REVIEW FLAGGED' 
                    : 'NOT COMPLIANT'}
              </div>
            </div>

            <div className="border-t border-b border-dashed border-border py-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-semibold">
              <div>
                <span className="text-[10px] text-muted block">APPLICANT</span>
                <span className="text-foreground font-bold mt-1 block">{candidate.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">APPLIED POSITION</span>
                <span className="text-foreground font-bold mt-1 block">{currentJob.title}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">ELIGIBILITY STATUS</span>
                <span className={`font-black mt-1 block ${
                  candidate.status === 'ELIGIBLE' ? 'text-success' : candidate.status === 'NEEDS_REVIEW' ? 'text-warning' : 'text-danger'
                }`}>
                  {candidate.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">EVALUATION METRIC</span>
                <span className="text-foreground font-bold mt-1 block">{candidate.matchScore}% Match Rate</span>
              </div>
            </div>

            <div className="text-xs text-muted leading-relaxed font-semibold flex flex-col gap-3">
              <h3 className="font-extrabold text-foreground uppercase tracking-wider text-[10px]">Verification Audit Summary</h3>
              <p>
                1. <strong className="text-foreground font-bold">Educational Verification:</strong> Academic qualifications parsed from Degree.pdf was successfully checked for degree equivalence (B.Tech) and marks cut-off validation.
              </p>
              <p>
                2. <strong className="text-foreground font-bold">Identity & Age Verification:</strong> Candidate's Date of Birth was verified against Aadhaar Card. Aadhaar record validation reports PASS.
              </p>
              <p>
                3. <strong className="text-foreground font-bold">Professional Experience Verification:</strong> Career details checked against submitted certificates. Experience letter verification results in: <strong className="text-foreground font-bold">{candidate.ruleCompliance.checks.experience.status}</strong>.
              </p>
              {candidate.crossDocumentVerification.length > 0 && (
                <p className="text-warning">
                  4. <strong className="font-bold uppercase">Cross-Document Conflict Warning:</strong> Discrepancies were identified during multi-document verification check. Refer to Step 6 warnings in this document.
                </p>
              )}
            </div>

            {/* Print signature lines */}
            <div className="mt-8 pt-8 border-t border-border flex justify-between items-center text-xs text-muted font-semibold flex-wrap gap-6">
              <div>
                <div className="w-40 h-px bg-muted/30 mb-2"></div>
                <span>Independent Evaluator Stamp</span>
              </div>
              <div className="text-right">
                <div className="w-40 h-px bg-muted/30 mb-2 ml-auto"></div>
                <span>Chief Recruitment Officer Sign</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: Interactive PDF Document Viewer */}
      {activeTab === 'documents' && (
        <div className="flex flex-col gap-4">
          <DocumentViewer candidate={candidate} />
        </div>
      )}

    </div>
  );
};
export default CandidatePage;
