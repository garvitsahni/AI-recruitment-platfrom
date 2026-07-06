import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Bell, Moon, Sparkles, Sun } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('recruitai_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('recruitai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="font-serif font-black text-foreground text-xl">
              Welcome back, Mayank
            </h2>
            <p className="text-xs text-muted font-medium mt-0.5">
              Here's what's happening with your recruitment evaluation.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Session Running
            </div>

            <button
              onClick={() => alert("AI Agent Tools:\n- JD Parsing Engine v2.4\n- Claims Verification Checker\n- Multi-Doc Mismatch Detector")}
              className="flex items-center gap-2 px-4.5 py-2 border border-border bg-card rounded-lg text-xs font-bold text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Tools
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 border border-border rounded-lg bg-card text-foreground"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <div className="relative">
              <button
                onClick={() => alert("Recent Notifications:\n1. 125 applicants processed\n2. Mismatch warning flagged for Aman Gupta")}
                className="p-2.5 border border-border rounded-lg bg-card text-foreground"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-danger text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border-2 border-card">
                  2
                </span>
              </button>
            </div>

            <hr className="w-px h-6 bg-border" />

            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shadow-sm">
              MA
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
