import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import { useEvaluation } from '../../store/evaluationContext';

export const DocumentVerifierPage: React.FC = () => {
  const { candidates } = useEvaluation();
  const eligibleCandidates = useMemo(
    () => candidates.filter(candidate => candidate.status === 'ELIGIBLE'),
    [candidates]
  );
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);

  const orderedCandidates = useMemo(() => {
    const ids = orderedIds.length ? orderedIds : eligibleCandidates.map(candidate => candidate.id);
    return ids
      .map(id => eligibleCandidates.find(candidate => candidate.id === id))
      .filter(Boolean)
      .concat(eligibleCandidates.filter(candidate => !ids.includes(candidate.id)));
  }, [eligibleCandidates, orderedIds]);

  const moveCandidate = (candidateId: string, direction: -1 | 1) => {
    const ids = orderedCandidates.map(candidate => candidate!.id);
    const index = ids.indexOf(candidateId);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ids.length) return;

    const updated = [...ids];
    const [moved] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, moved);
    setOrderedIds(updated);
  };

  const toggleVerified = (candidateId: string) => {
    setVerifiedIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif font-black text-2xl text-foreground tracking-tight">Document Verifier</h1>
        <p className="text-sm text-muted font-medium mt-1">
          Verify source documents and place eligible candidates in final review order.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="font-serif font-black text-xl text-foreground">Eligible Candidate Order</h2>
            <span className="text-xs font-bold text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
              {eligibleCandidates.length} Eligible
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {orderedCandidates.map((candidate, index) => {
              if (!candidate) return null;
              const verified = verifiedIds.includes(candidate.id);

              return (
                <div key={candidate.id} className="border border-border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">{candidate.name}</h3>
                      <p className="text-xs text-muted font-medium truncate">
                        {candidate.extractedData.qualification.value} · {candidate.extractedData.experienceYears.value} years experience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveCandidate(candidate.id, -1)}
                      disabled={index === 0}
                      className="w-8 h-8 rounded-lg border border-border bg-card text-foreground flex items-center justify-center disabled:opacity-40"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCandidate(candidate.id, 1)}
                      disabled={index === orderedCandidates.length - 1}
                      className="w-8 h-8 rounded-lg border border-border bg-card text-foreground flex items-center justify-center disabled:opacity-40"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVerified(candidate.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold border ${
                        verified ? 'bg-success/10 text-success border-success/20' : 'bg-card text-foreground border-border'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {verified ? 'Verified' : 'Verify Documents'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-4 bg-card border border-border rounded-xl p-6 shadow-sm h-fit">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-black text-xl text-foreground">Verification Summary</h2>
          <div className="mt-5 flex flex-col gap-3 text-sm font-semibold">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-muted">Eligible candidates</span>
              <span className="text-foreground">{eligibleCandidates.length}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-muted">Documents verified</span>
              <span className="text-success">{verifiedIds.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Pending verification</span>
              <span className="text-warning">{Math.max(eligibleCandidates.length - verifiedIds.length, 0)}</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-xs font-bold"
            onClick={() => alert('Candidate order saved for final report.')}
          >
            <FileCheck2 className="w-4 h-4" />
            Save Verification Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerifierPage;
