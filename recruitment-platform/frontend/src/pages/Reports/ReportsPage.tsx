import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvaluation } from '../../store/evaluationContext';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { candidates, runs, jobs, currentJob } = useEvaluation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_REVIEW'>('ALL');

  const filteredCandidates = candidates.filter(cand => {
    const matchesSearch = cand.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || cand.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExportExcel = () => {
    alert("Export Completed!\nReport with 7-step citation manifest saved as 'RecruitAI_Master_Audit.xlsx'.");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-black text-2xl text-foreground tracking-tight">Recruitment Audit Logs</h1>
          <p className="text-xs text-muted font-medium mt-1">
            Access past verification runs, full eligibility manifests, and evidence files.
          </p>
        </div>
        
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs py-3 px-5 rounded-2xl shadow-md shadow-primary/10 transition-all"
        >
          <FileSpreadsheet className="w-4.5 h-4.5 text-primary-foreground" />
          Export Audit Manifest
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Side: Active Run Overview Table */}
        <div className="xl:col-span-9 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Candidate Verification Records</h2>
            
            {/* Filter and Search actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-500/5 border border-border text-foreground text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary transition-all w-48"
                />
              </div>

              {/* Status filter selection */}
              <div className="flex border border-border rounded-xl overflow-hidden text-xs font-bold">
                <button 
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-2 transition-all ${statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted hover:bg-accent'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setStatusFilter('ELIGIBLE')}
                  className={`px-3 py-2 transition-all ${statusFilter === 'ELIGIBLE' ? 'bg-success text-success-foreground font-extrabold' : 'bg-card text-muted hover:bg-accent'}`}
                >
                  Eligible
                </button>
                <button 
                  onClick={() => setStatusFilter('NEEDS_REVIEW')}
                  className={`px-3 py-2 transition-all ${statusFilter === 'NEEDS_REVIEW' ? 'bg-warning text-warning-foreground font-extrabold' : 'bg-card text-muted hover:bg-accent'}`}
                >
                  Review
                </button>
                <button 
                  onClick={() => setStatusFilter('NOT_ELIGIBLE')}
                  className={`px-3 py-2 transition-all ${statusFilter === 'NOT_ELIGIBLE' ? 'bg-danger text-danger-foreground font-extrabold' : 'bg-card text-muted hover:bg-accent'}`}
                >
                  Failed
                </button>
              </div>
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Candidate Name</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Degree Verified</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Marks aggregate</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Experience duration</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Age</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Eligibility</th>
                  <th className="py-3 text-left font-bold text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted font-semibold">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => {
                    const statusTag = {
                      ELIGIBLE: 'bg-success/10 text-success border-success/20',
                      NOT_ELIGIBLE: 'bg-danger/10 text-danger border-danger/20',
                      NEEDS_REVIEW: 'bg-warning/10 text-warning border-warning/20',
                      PENDING: 'bg-accent text-muted border-border'
                    }[cand.status];

                    return (
                      <tr key={cand.id} className="hover:bg-slate-500/2 transition-colors">
                        <td className="py-4 font-bold text-foreground flex items-center gap-3">
                          <img src={cand.avatarUrl} alt={cand.name} className="w-7 h-7 rounded-full object-cover border border-border shadow-sm" />
                          {cand.name}
                        </td>
                        <td className="py-4 font-semibold text-foreground">
                          {cand.extractedData.qualification.value}
                        </td>
                        <td className="py-4 font-semibold text-foreground">
                          {cand.extractedData.percentage.value}%
                        </td>
                        <td className="py-4 font-semibold text-foreground">
                          {cand.extractedData.experienceYears.value} Years
                        </td>
                        <td className="py-4 font-semibold text-foreground">
                          {cand.ruleCompliance.checks.age.actual.split(' ')[0]} Years
                        </td>
                        <td className="py-4">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusTag}`}>
                            {cand.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4">
                          <button 
                            onClick={() => navigate(`/candidate/${cand.id}`)}
                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                          >
                            Inspect Audit
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Evaluation Runs logs history */}
        <div className="xl:col-span-3 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Evaluation History</h2>
          </div>
          
          <div className="flex flex-col gap-4.5">
            {runs.map((run) => (
              <div key={run.id} className="p-4 bg-slate-500/5 rounded-2xl border border-border flex flex-col gap-2 shadow-sm text-xs">
                <div className="flex justify-between items-center font-bold text-[10px] text-muted">
                  <span>RUN ID: {run.id.toUpperCase()}</span>
                  <span>{run.date.split(' ')[2] || ''}</span>
                </div>
                <div className="font-bold text-foreground">
                  {jobs.find(j => j.id === run.jobId)?.title}
                </div>
                <div className="text-[10px] text-muted font-medium mt-1">
                  Ran: {run.date}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/80 text-center font-bold text-[10px] leading-tight">
                  <div className="text-success">
                    <div>{run.eligibleCount}</div>
                    <span className="text-[8px] font-semibold text-muted uppercase">Pass</span>
                  </div>
                  <div className="text-warning">
                    <div>{run.reviewCount}</div>
                    <span className="text-[8px] font-semibold text-muted uppercase">Review</span>
                  </div>
                  <div className="text-danger">
                    <div>{run.notEligibleCount}</div>
                    <span className="text-[8px] font-semibold text-muted uppercase">Fail</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default ReportsPage;
