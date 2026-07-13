import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  History, 
  FileCode, 
  HelpCircle, 
  Sparkles,
  CheckCircle2,
  Activity,
  Clock3,
  FileCheck2,
  Upload,
  FileText,
  ScanSearch,
  ShieldCheck,
  ListChecks,
  GitCompareArrows
} from 'lucide-react';
import { useEvaluation } from '../store/evaluationContext';

export const Sidebar: React.FC = () => {
  const { isEvaluating, evaluationStep, applicationFileName, jdFileName, runs, jobs } = useEvaluation();

  const showProcessingStatus = () => {
    const status = isEvaluating ? `Running step ${evaluationStep}` : 'Ready';
    alert(`AI Processing Status\nStatus: ${status}\nCurrent Stage: ${evaluationStep}/4`);
  };

  const showRecentActivity = () => {
    const recent = runs.slice(0, 3).map(run => {
      const jobTitle = jobs.find(j => j.id === run.jobId)?.title || 'Selected role';
      return `${run.date} - ${jobTitle}: ${run.totalCandidates} candidates`;
    }).join('\n');

    alert(`Recent Activity\n${recent || 'No recent activity yet.'}`);
  };

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between fixed left-0 top-0 z-20">
      <div className="flex flex-col">
        {/* Branding */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif font-black text-foreground tracking-tight text-lg">RecruitAI Validator</h1>
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">Validator</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="p-4 flex flex-col gap-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground border border-border'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Command Center
          </NavLink>
        </div>

        {/* Steps section */}
        <div className="px-6 py-2">
          <details open className="group">
            <summary className="list-none cursor-pointer text-[10px] font-bold uppercase tracking-widest text-muted flex items-center justify-between">
              Pipeline Stages
              <span className="text-sm text-foreground">⌄</span>
            </summary>
            <div className="mt-4 flex flex-col gap-4 pl-1 text-sm text-foreground">
              {[
                { label: '1 · Requirement Extraction', icon: Upload, done: Boolean(applicationFileName) },
                { label: '2 · Document Processing', icon: FileText, done: Boolean(jdFileName) },
                { label: '3 · Information Extraction', icon: ScanSearch, done: evaluationStep >= 4 },
                { label: '4 · Evidence Validation', icon: ShieldCheck, done: evaluationStep >= 4 },
                { label: '5 · Rule Compliance', icon: ListChecks, done: evaluationStep >= 4 },
                { label: '6 · Cross-Document Check', icon: GitCompareArrows, done: evaluationStep >= 4 }
              ].map((stage) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.label} className="flex items-center justify-between gap-3 font-medium">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-muted shrink-0" />
                      <span className="truncate">{stage.label}</span>
                    </div>
                    {stage.done && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                  </div>
                );
              })}
            </div>
          </details>
        </div>

        {/* Workspace section */}
        <div className="p-4 flex flex-col gap-1">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Workspace</span>
          <NavLink 
            to="/document-verifier" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm ${
                isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-card text-foreground border border-border'
              }`
            }
          >
            <FileCheck2 className="w-5 h-5" />
            Document Verifier
          </NavLink>
          <button
            onClick={showProcessingStatus}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm bg-card text-foreground border border-border w-full text-left"
          >
            <Activity className="w-5 h-5" />
            AI Processing Status
          </button>
          <button
            onClick={showRecentActivity}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm bg-card text-foreground border border-border w-full text-left"
          >
            <Clock3 className="w-5 h-5" />
            Recent Activity
          </button>
          <NavLink 
            to="/reports" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-card text-foreground border border-border'
              }`
            }
          >
            <History className="w-5 h-5" />
            Recent Runs
          </NavLink>
          <NavLink 
            to="/recruitment" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-card text-foreground border border-border'
              }`
            }
          >
            <FileCode className="w-5 h-5" />
            Templates
          </NavLink>
        </div>

        {/* Settings section */}
        <div className="p-4 flex flex-col gap-1 border-t border-border">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Settings</span>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-card text-foreground border border-border'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Preferences
          </NavLink>
          <button 
            onClick={() => alert("RecruitAI Validator Support Center\nFor queries email: support@recruitai.com")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm bg-card text-foreground border border-border w-full text-left"
          >
            <HelpCircle className="w-5 h-5" />
            Help & Support
          </button>
        </div>
      </div>
    </div>
  );
};
