import React, { useState, useEffect } from 'react';
import { Candidate, CandidateDocument, FieldWithCitation } from '../types';
import { FileText, Eye, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface DocumentViewerProps {
  candidate: Candidate;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ candidate }) => {
  const [selectedField, setSelectedField] = useState<string>('qualification');
  const [activeDocName, setActiveDocName] = useState<string>('Degree.pdf');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);

  // Get current citation info based on selected field
  const getFieldCitation = (): FieldWithCitation<any> | null => {
    const data = candidate.extractedData as any;
    if (data && data[selectedField]) {
      return data[selectedField];
    }
    return null;
  };

  const citation = getFieldCitation();

  // Sync document and page when selected field changes
  useEffect(() => {
    if (citation) {
      setActiveDocName(citation.fileName);
      setCurrentPage(citation.page);
    }
  }, [selectedField]);

  // Find active document details
  const activeDoc = candidate.documents.find(d => d.fileName === activeDocName);

  // Get page text with highlighting
  const renderPageText = () => {
    if (!activeDoc) return <div className="text-muted-foreground p-8 text-center">Document not found</div>;
    if (!activeDoc.exists) return <div className="text-danger font-semibold p-8 text-center">Error: Document file "{activeDocName}" does not exist in candidate folder.</div>;
    
    const text = activeDoc.rawTextByPage[currentPage] || '';
    if (!text) return <div className="text-muted-foreground p-8 text-center">Empty Page</div>;

    if (citation && citation.fileName === activeDocName && citation.page === currentPage) {
      const snippet = citation.snippet;
      const index = text.indexOf(snippet);
      if (index !== -1) {
        const before = text.substring(0, index);
        const match = text.substring(index, index + snippet.length);
        const after = text.substring(index + snippet.length);
        return (
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground select-text p-6">
            {before}
            <span className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700 px-1 py-0.5 rounded font-bold transition-all relative group cursor-help">
              {match}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none uppercase tracking-wider font-semibold whitespace-nowrap z-30">
                Cited Snippet
              </span>
            </span>
            {after}
          </pre>
        );
      }
    }

    return (
      <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground select-text p-6">
        {text}
      </pre>
    );
  };

  const fieldsList = [
    { key: 'name', label: 'Candidate Name' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'qualification', label: 'Education Degree' },
    { key: 'percentage', label: 'Percentage / GPA' },
    { key: 'experienceYears', label: 'Years of Experience' },
    { key: 'employer', label: 'Last Employer' },
    { key: 'employmentPeriod', label: 'Tenure Period' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      
      {/* Left panel: Citation Selector */}
      <div className="lg:col-span-4 border-r border-border p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">AI Extracted Citations</h3>
          </div>
          <p className="text-xs text-muted font-medium mb-4 leading-relaxed">
            Click on any extracted parameter below to jump to its source citation page in the candidate's verified files.
          </p>

          <div className="flex flex-col gap-2">
            {fieldsList.map((item) => {
              const claim = (candidate.extractedData as any)[item.key];
              const isActive = selectedField === item.key;
              const validation = candidate.evidenceValidation.validations[item.key] || 
                                 (item.key === 'percentage' ? candidate.evidenceValidation.validations['percentage'] : null);
              const isPassed = validation ? validation.status === 'PASS' : true;

              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedField(item.key)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    isActive 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'border-border bg-slate-500/5 hover:bg-accent'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted'}`}>
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isPassed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {isPassed ? 'VERIFIED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-foreground truncate">
                    {Array.isArray(claim?.value) ? claim.value.join(', ') : claim?.value || 'Not Extracted'}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted font-medium">
                    <span className="truncate">{claim?.fileName || 'No Doc'}</span>
                    <span>Page {claim?.page || '0'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Check Summary Box */}
        {citation && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-500/5 border border-border flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase text-muted">Evidence Checker Details</span>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              {candidate.evidenceValidation.validations[selectedField]?.status === 'PASS' ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-danger" />
              )}
              {candidate.evidenceValidation.validations[selectedField]?.status === 'PASS' 
                ? 'Independent Validation Success' 
                : 'Validation Discrepancy Found'}
            </div>
            <div className="text-[11px] text-muted leading-relaxed font-medium">
              <p className="mb-1"><strong className="text-foreground font-semibold">Citing Document:</strong> {citation.fileName}</p>
              <p className="mb-1"><strong className="text-foreground font-semibold">Page Number:</strong> {citation.page}</p>
              <p><strong className="text-foreground font-semibold">Cited Snippet:</strong> "{citation.snippet}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel: PDF Simulator Viewport */}
      <div className="lg:col-span-8 flex flex-col h-[650px] bg-slate-100 dark:bg-slate-955">
        
        {/* PDF Header Toolbar */}
        <div className="bg-card border-b border-border p-3.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                {activeDocName}
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-accent rounded text-muted uppercase">
                  {activeDoc?.category}
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium">
                Page {currentPage} of {activeDoc?.pagesCount || 1}
              </span>
            </div>
          </div>

          {/* PDF Page Controls */}
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-foreground select-none px-1">
              {currentPage} / {activeDoc?.pagesCount || 1}
            </span>
            <button 
              disabled={currentPage >= (activeDoc?.pagesCount || 1)}
              onClick={() => setCurrentPage(p => Math.min(activeDoc?.pagesCount || 1, p + 1))}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom and Aux Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-foreground w-10 text-center select-none">
              {zoom}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => alert(`Downloading ${activeDocName}...`)}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent ml-1"
              title="Download Original PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PDF Simulated Sheet Viewer */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg origin-top transition-transform duration-150 relative min-h-[500px]"
            style={{ 
              transform: `scale(${zoom / 100})`, 
              width: '100%', 
              maxWidth: '650px',
              fontFamily: 'Courier New, Courier, monospace'
            }}
          >
            {/* Watermark in viewer background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none overflow-hidden">
              <div className="font-sans font-black text-6xl rotate-45 tracking-widest text-slate-800 select-none uppercase">
                RECRUIT AI AUDIT
              </div>
            </div>

            {/* Document Header lines */}
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between text-[10px] font-mono text-muted select-none">
              <span>RECRUIT_AI_VALIDATOR_ENGINE</span>
              <span>VERIFIED_SOURCE_FILE</span>
            </div>

            {/* Main content text container */}
            <div className="p-2">
              {renderPageText()}
            </div>
          </div>
        </div>

        {/* Cited claims compare banner */}
        {citation && (
          <div className="bg-card border-t border-border p-4 px-6 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-primary uppercase">CITED TEXT SNIPPET</span>
              <p className="text-xs font-mono font-bold text-foreground">"{citation.snippet}"</p>
            </div>
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-3.5 py-1.5 rounded-xl text-success font-bold text-xs">
              <CheckCircle className="w-4 h-4" />
              Verified & Audit Checked
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
