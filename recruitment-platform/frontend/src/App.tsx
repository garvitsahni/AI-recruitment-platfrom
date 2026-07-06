import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EvaluationProvider } from './store/evaluationContext';
import { ensureAuthenticated } from './services/api';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { RecruitmentPage } from './pages/Recruitment/RecruitmentPage';
import { CandidatePage } from './pages/Candidate/CandidatePage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { DocumentVerifierPage } from './pages/DocumentVerifier/DocumentVerifierPage';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      await ensureAuthenticated();
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication failed', err);
      setIsAuthenticated(false);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check backend status.');
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
          {error && !isAuthenticating ? (
            <>
              <div className="text-red-400 font-bold mb-4">Authentication Error</div>
              <p className="text-sm text-slate-300 mb-6">{error}</p>
              <button
                type="button"
                onClick={() => void authenticate()}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md"
              >
                Retry Authentication
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-sm font-semibold tracking-wider uppercase text-slate-400">Authenticating</div>
              <p className="text-xs text-slate-500 mt-2">Setting up development session...</p>
            </>
          )}
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthWrapper>
      <EvaluationProvider>
        <HashRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/recruitment" element={<RecruitmentPage />} />
              <Route path="/candidate/:id" element={<CandidatePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/document-verifier" element={<DocumentVerifierPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </HashRouter>
      </EvaluationProvider>
    </AuthWrapper>
  );
}

export default App;
