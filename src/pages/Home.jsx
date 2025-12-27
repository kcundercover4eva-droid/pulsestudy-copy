import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LandingScreen from '@/components/LandingScreen';
import OnboardingWizard from '@/components/OnboardingWizard';
import Dashboard from '@/components/dashboard/Dashboard';
import StudyHub from '@/components/quiz/StudyHub';
import ScheduleBuilder from '@/components/schedule/ScheduleBuilder';
import GenerateContent from './GenerateContent';
import { Calendar, Brain, LayoutDashboard, Home as HomeIcon, Upload } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState('landing'); // landing, onboarding, app
  const [appTab, setAppTab] = useState('dashboard'); // dashboard, quiz, schedule, generate

  // Fetch user profile for accent color
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { accentColor: 'neonGreen' };
    },
    enabled: view === 'app',
  });

  if (view === 'landing') {
    return <LandingScreen onGetStarted={() => setView('onboarding')} />;
  }

  if (view === 'onboarding') {
    return <OnboardingWizard onComplete={() => setView('app')} />;
  }

  // Map accent colors to CSS color values
  const accentColor = userProfile?.accentColor || 'neonGreen';
  const themeColors = {
    neonGreen: { primary: '#4ade80', secondary: '#22c55e', gradient: 'from-green-500 to-emerald-500' },
    coral: { primary: '#fb7185', secondary: '#f43f5e', gradient: 'from-rose-500 to-pink-500' },
    electricBlue: { primary: '#06b6d4', secondary: '#0891b2', gradient: 'from-cyan-500 to-blue-500' }
  };
  const theme = themeColors[accentColor];

  // App Layout
  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col font-sans overflow-hidden" style={{
      '--accent-primary': theme.primary,
      '--accent-secondary': theme.secondary
    }}>
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-28">
        <div className="min-h-full">
          {appTab === 'dashboard' && <Dashboard />}
          {appTab === 'quiz' && <StudyHub />}
          {appTab === 'schedule' && (
            <div className="p-4">
              <ScheduleBuilder />
            </div>
          )}
          {appTab === 'generate' && <GenerateContent />}
        </div>
      </main>

      {/* Bottom Nav - Fully Visible */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-white/20 z-[9999] shadow-2xl py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="w-full grid grid-cols-4 gap-1 max-w-screen-lg mx-auto px-3">
          <button 
            onClick={() => setAppTab('schedule')}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-95 ${appTab === 'schedule' ? 'bg-white/10' : ''}`}
            style={appTab === 'schedule' ? { color: 'var(--accent-primary)' } : { color: '#94a3b8' }}
          >
            <Calendar className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-[10px] font-bold whitespace-nowrap">Schedule</span>
          </button>

          <button 
            onClick={() => setAppTab('generate')}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-95 ${appTab === 'generate' ? 'bg-white/10' : ''}`}
            style={appTab === 'generate' ? { color: 'var(--accent-primary)' } : { color: '#94a3b8' }}
          >
            <Upload className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-[10px] font-bold whitespace-nowrap">Upload</span>
          </button>

          <button 
            onClick={() => setAppTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-95 ${appTab === 'dashboard' ? 'bg-white/10' : ''}`}
            style={appTab === 'dashboard' ? { color: 'var(--accent-primary)' } : { color: '#94a3b8' }}
          >
            <HomeIcon className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-[10px] font-bold whitespace-nowrap">Home</span>
          </button>

          <button 
            onClick={() => setAppTab('quiz')}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-95 ${appTab === 'quiz' ? 'bg-white/10' : ''}`}
            style={appTab === 'quiz' ? { color: 'var(--accent-primary)' } : { color: '#94a3b8' }}
          >
            <Brain className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-[10px] font-bold whitespace-nowrap">Quiz</span>
          </button>
        </div>
      </nav>
    </div>
  );
}