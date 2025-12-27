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
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 pt-safe">
        <div>
          {appTab === 'dashboard' && <Dashboard />}
          {appTab === 'quiz' && <StudyHub />}
          {appTab === 'schedule' && (
            <div className="p-3 md:p-4">
              <ScheduleBuilder />
            </div>
          )}
          {appTab === 'generate' && <GenerateContent />}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Optimized */}
      <nav 
        className="fixed left-0 right-0 z-[99999] bg-slate-900 border-t-2 border-white/20 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
        style={{ 
          bottom: '0',
          paddingTop: '12px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 56px), 56px)',
          touchAction: 'manipulation'
        }}
      >
        <div className="w-full max-w-screen-lg mx-auto">
          <div className="grid grid-cols-4 gap-0">
            {/* Schedule Tab */}
            <button 
              onClick={() => setAppTab('schedule')}
              className="flex flex-col items-center justify-center min-h-[68px] px-3 py-2 transition-all active:scale-95 touch-manipulation relative"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className={`flex flex-col items-center gap-1 ${appTab === 'schedule' ? 'transform scale-105' : ''}`}>
                <Calendar 
                  className="w-7 h-7 mb-0.5 text-white" 
                  strokeWidth={2.5}
                  style={appTab === 'schedule' ? { color: theme.primary } : {}}
                />
                <span 
                  className="text-[11px] font-semibold whitespace-nowrap text-white"
                  style={appTab === 'schedule' ? { color: theme.primary } : {}}
                >
                  Schedule
                </span>
              </div>
              {appTab === 'schedule' && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
              )}
            </button>

            {/* Upload Tab */}
            <button 
              onClick={() => setAppTab('generate')}
              className="flex flex-col items-center justify-center min-h-[68px] px-3 py-2 transition-all active:scale-95 touch-manipulation relative"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className={`flex flex-col items-center gap-1 ${appTab === 'generate' ? 'transform scale-105' : ''}`}>
                <Upload 
                  className="w-7 h-7 mb-0.5 text-white" 
                  strokeWidth={2.5}
                  style={appTab === 'generate' ? { color: theme.primary } : {}}
                />
                <span 
                  className="text-[11px] font-semibold whitespace-nowrap text-white"
                  style={appTab === 'generate' ? { color: theme.primary } : {}}
                >
                  Upload
                </span>
              </div>
              {appTab === 'generate' && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
              )}
            </button>

            {/* Home Tab */}
            <button 
              onClick={() => setAppTab('dashboard')}
              className="flex flex-col items-center justify-center min-h-[68px] px-3 py-2 transition-all active:scale-95 touch-manipulation relative"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className={`flex flex-col items-center gap-1 ${appTab === 'dashboard' ? 'transform scale-105' : ''}`}>
                <HomeIcon 
                  className="w-7 h-7 mb-0.5 text-white" 
                  strokeWidth={2.5}
                  style={appTab === 'dashboard' ? { color: theme.primary } : {}}
                />
                <span 
                  className="text-[11px] font-semibold whitespace-nowrap text-white"
                  style={appTab === 'dashboard' ? { color: theme.primary } : {}}
                >
                  Home
                </span>
              </div>
              {appTab === 'dashboard' && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
              )}
            </button>

            {/* Quiz Tab */}
            <button 
              onClick={() => setAppTab('quiz')}
              className="flex flex-col items-center justify-center min-h-[68px] px-3 py-2 transition-all active:scale-95 touch-manipulation relative"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className={`flex flex-col items-center gap-1 ${appTab === 'quiz' ? 'transform scale-105' : ''}`}>
                <Brain 
                  className="w-7 h-7 mb-0.5 text-white" 
                  strokeWidth={2.5}
                  style={appTab === 'quiz' ? { color: theme.primary } : {}}
                />
                <span 
                  className="text-[11px] font-semibold whitespace-nowrap text-white"
                  style={appTab === 'quiz' ? { color: theme.primary } : {}}
                >
                  Quiz
                </span>
              </div>
              {appTab === 'quiz' && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
              )}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}