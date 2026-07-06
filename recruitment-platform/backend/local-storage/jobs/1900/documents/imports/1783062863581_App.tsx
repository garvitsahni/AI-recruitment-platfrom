import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EvaluationProvider } from './store/evaluationContext';
import { api, setAuthToken, getAuthToken } from './services/api';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { RecruitmentPage } from './pages/Recruitment/RecruitmentPage';
import { CandidatePage } from './pages/Candidate/CandidatePage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { DocumentVerifierPage } from './pages/DocumentVerifier/DocumentVerifierPage';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isAuthenticating) {
      setIsAuthenticating(true);
      api.post('/auth/login', { email: 'recruiter@recruitment.local', password: 'Recruiter@123456' })
        .then(res => {
          setAuthToken(res.token);
          setIsAuthenticated(true);
        })
        .catch(err => {
          console.error('Auto-login failed', err);
        })
        .finally(() => {
          setIsAuthenticating(false);
        });
    }
  }, [isAuthenticated, isAuthenticating]);

  if (!isAuthenticated) return <div className="p-8 text-center">Authenticating (Development Mode)...</div>;
  
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
