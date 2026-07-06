import React, { useState } from 'react';
import { useEvaluation } from '../../store/evaluationContext';
import { Settings, Save, Trash2, CheckCircle, RefreshCcw, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { resetDatabase } = useEvaluation();
  const [userName, setUserName] = useState('Mayank');
  const [systemPrompt, setSystemPrompt] = useState(
    'Extract candidate name, DOB, qualification degree, percentage, experience duration, and skills from the uploaded certificates. Include the exact page number and text snippet as source citations.'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore the system database to factory defaults? All manual edits will be lost.")) {
      resetDatabase();
      setIsReset(true);
      setTimeout(() => setIsReset(false), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-foreground tracking-tight">System Preferences</h1>
        <p className="text-xs text-muted font-medium mt-1">
          Configure RecruitAI parser parameters, profile details, and cache databases.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: General Profile & Prompt settings */}
        <div className="xl:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">AI Model parameters</h2>
            </div>

            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                HR Officer Display Name
              </label>
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                className="bg-slate-500/5 border border-border text-foreground text-xs font-bold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all"
                required
              />
            </div>

            {/* AI Prompts customization */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Gemini Extraction System Instructions
                </label>
                <span className="text-[9px] font-extrabold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  PROMPT TUNING
                </span>
              </div>
              <textarea 
                rows={5}
                value={systemPrompt} 
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="bg-slate-500/5 border border-border text-foreground text-xs font-semibold p-3.5 rounded-2xl w-full outline-none focus:border-primary transition-all resize-none leading-relaxed"
                required
              />
              <p className="text-[10px] text-muted leading-relaxed mt-0.5">
                These instructions specify how the Gemini Information Extraction Engine (Step 3) processes candidate PDF raw text. Modify this prompt to extract additional certifications or skills.
              </p>
            </div>

            <div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs py-3 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-primary/10 transition-all"
              >
                <Save className="w-4 h-4" />
                Save System Config
              </button>
            </div>
          </form>

          {/* Success Banner */}
          {isSaved && (
            <div className="mt-4 p-3 bg-success/15 border border-success/20 text-success rounded-xl flex items-center gap-2 text-xs font-bold justify-center animate-fade">
              <CheckCircle className="w-4.5 h-4.5" />
              Settings saved! AI model parameters updated.
            </div>
          )}
        </div>

        {/* Right Side: Factory Reset Database */}
        <div className="xl:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider mb-4 text-danger">
              System Operations
            </h3>
            <p className="text-xs text-muted font-medium leading-relaxed mb-6">
              Perform administrative operations like clearing audit logs, reset job requirement schemas, and wiping candidate evaluation runs cache.
            </p>
            
            <button 
              onClick={handleReset}
              className="w-full border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-all text-xs font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              Restore Factory Defaults
            </button>
          </div>

          {isReset && (
            <div className="mt-4 p-3 bg-success/15 border border-success/20 text-success rounded-xl flex items-center gap-2 text-xs font-bold justify-center animate-fade">
              <CheckCircle className="w-4.5 h-4.5" />
              Database reset to defaults successful!
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default SettingsPage;
