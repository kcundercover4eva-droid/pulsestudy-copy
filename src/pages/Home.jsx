import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LandingScreen from '@/components/LandingScreen';
import OnboardingWizard from '@/components/OnboardingWizard';
import FirstTimeGuide from '@/components/onboarding/FirstTimeGuide';
import Dashboard from '@/components/dashboard/Dashboard';
import StudyHub from '@/components/quiz/StudyHub';
import ScheduleBuilder from '@/components/schedule/ScheduleBuilder';
import GenerateContent from './GenerateContent';
import { useBottomPadding } from '@/components/utils/useBottomPadding';
import { Calendar, Brain, LayoutDashboard, Home as HomeIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [view, setView] = useState('checking'); // checking, landing, onboarding, app
  const [appTab, setAppTab] = useState('dashboard'); // dashboard, quiz, schedule, generate
  const [guideStep, setGuideStep] = useState(0);
  const [showScheduleHelp, setShowScheduleHelp] = useState(false);
  const [showGenerateHelp, setShowGenerateHelp] = useState(false);
  const dynamicPadding = useBottomPadding();
  const queryClient = useQueryClient();

  // Fetch user profile for accent color
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { accentColor: 'neonGreen', hasCompletedOnboarding: false };
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 0) {
        return await base44.entities.UserProfile.update(profiles[0].id, updates);
      } else {
        return await base44.entities.UserProfile.create(updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  // Determine initial view based on profile
  React.useEffect(() => {
    if (profileLoading || view !== 'checking') return;
    
    if (!userProfile?.hasCompletedOnboarding) {
      // First time user - show onboarding wizard
      setView('onboarding');
    } else {
      // Show landing every time
      setView('landing');
    }
  }, [userProfile, profileLoading, view]);



  if (view === 'checking' || profileLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (view === 'onboarding') {
    return <OnboardingWizard onComplete={() => {
      updateProfileMutation.mutate({ hasCompletedOnboarding: true });
      setGuideStep(1);
      setView('app');
    }} />;
  }

  if (view === 'landing') {
    return <LandingScreen onGetStarted={() => {
      setView('app');
      setGuideStep(1);
    }} />;
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
      {/* First Time Guide */}
      {guideStep > 0 && (
        <FirstTimeGuide
          currentStep={guideStep}
          onNext={() => setGuideStep(prev => prev + 1)}
          onComplete={() => {
            setGuideStep(0);
            updateProfileMutation.mutate({ hasCompletedOnboarding: true });
          }}
        />
      )}

      {/* Schedule Help Prompt */}
      {showScheduleHelp && (
        <div className="fixed inset-0 z-[100000]" style={{ pointerEvents: 'auto' }}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100002] rounded-2xl p-6 w-80 max-w-[90vw] bg-slate-900 border-2 border-purple-500/50 shadow-2xl">
            <p className="text-white text-lg font-bold mb-4 text-center leading-tight drop-shadow-lg">
              Let me help u plan ur day
            </p>
            <Button
              onClick={() => {
                setShowScheduleHelp(false);
                updateProfileMutation.mutate({ hasSeenScheduleIntro: true });
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform h-12 font-bold"
            >
              Got it! ✓
            </Button>
          </div>
        </div>
      )}

      {/* Generate/Upload Help Prompt */}
      {showGenerateHelp && (
        <div className="fixed inset-0 z-[100000]" style={{ pointerEvents: 'auto' }}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100002] rounded-2xl p-6 w-80 max-w-[90vw] bg-slate-900 border-2 border-purple-500/50 shadow-2xl">
            <p className="text-white text-lg font-bold mb-4 text-center leading-tight drop-shadow-lg">
              Upload school stuff here for quiz
            </p>
            <Button
              onClick={() => {
                setShowGenerateHelp(false);
                updateProfileMutation.mutate({ hasSeenGenerateIntro: true });
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform h-12 font-bold"
            >
              Got it! ✓
            </Button>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-safe" style={{ paddingBottom: `${dynamicPadding}px` }}>
        <div>
          {appTab === 'dashboard' && <Dashboard />}
          {appTab === 'quiz' && <StudyHub />}
          {appTab === 'schedule' && (
            <div className="p-3 md:p-4 pb-6 min-h-mobile">
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
        <style>
          {`
            @media (min-width: 768px) {
              nav {
                padding-bottom: max(env(safe-area-inset-bottom, 26px), 26px) !important;
              }
            }
          `}
        </style>
        <div className="w-full max-w-screen-lg mx-auto">
          <div className="grid grid-cols-4 gap-0">
            {/* Schedule Tab */}
            <button 
              data-tab="schedule"
              onClick={() => {
                setAppTab('schedule');
                if (guideStep === 0 && !userProfile?.hasSeenScheduleIntro) {
                  setTimeout(() => setShowScheduleHelp(true), 300);
                }
              }}
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
              data-tab="generate"
              onClick={() => {
                setAppTab('generate');
                if (guideStep === 0 && !userProfile?.hasSeenGenerateIntro) {
                  setTimeout(() => setShowGenerateHelp(true), 300);
                }
              }}
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
              data-tab="study"
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