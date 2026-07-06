import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvaluation } from '../../store/evaluationContext';
import { PipelineSteps } from '../../components/PipelineSteps';
import { ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    candidates,
    isEvaluating,
    setSelectedCandidateId
  } = useEvaluation();

  const handleExportExcel = () => {
    alert("Excel report generated successfully!\nReport saved as 'Eligibility_Audit_Report.xlsx' with citations.");
  };

  const handleViewCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    navigate(`/candidate/${candidateId}`);
  };

  return (
    <div className="flex flex-col gap-9 max-w-7xl mx-auto">
      <PipelineSteps onExportExcel={handleExportExcel} />

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 gap-4">
          <h3 className="font-serif font-black text-xl text-foreground">Top Candidates</h3>
          <button
            onClick={() => navigate('/reports')}
            className="text-sm font-bold text-primary flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isEvaluating ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-muted">Running AI evaluation pipeline...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {candidates.slice(0, 6).map((candidate, idx) => {
              const statusColors = {
                ELIGIBLE: 'bg-success/10 text-success border-success/20',
                NOT_ELIGIBLE: 'bg-danger/10 text-danger border-danger/20',
                NEEDS_REVIEW: 'bg-warning/10 text-warning border-warning/20',
                PENDING: 'bg-accent text-muted border-border'
              }[candidate.status];

              return (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-400/20 text-amber-500' : idx === 1 ? 'bg-slate-300/30 text-slate-500' : 'bg-orange-300/20 text-orange-600'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-foreground truncate">{candidate.name}</span>
                      <span className="text-[10px] text-muted font-medium truncate">
                        {candidate.extractedData.experienceYears.value}+ Yrs Exp - {candidate.extractedData.skills.value.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusColors}`}>
                      {candidate.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleViewCandidate(candidate.id)}
                      className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
