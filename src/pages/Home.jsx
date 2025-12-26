import React, { useState } from 'react';
import LandingScreen from '@/components/LandingScreen';
import OnboardingWizard from '@/components/OnboardingWizard';
import Dashboard from '@/components/dashboard/Dashboard';
import QuizFeed from '@/components/quiz/QuizFeed';
import ScheduleBuilder from '@/components/schedule/ScheduleBuilder';
import GenerateContent from './GenerateContent';
import { Calendar, Brain, LayoutDashboard, Home as HomeIcon, Upload } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState('landing'); // landing, onboarding, app
  const [appTab, setAppTab] = useState('dashboard'); // dashboard, quiz, schedule, generate

  if (view === 'landing') {
    return <LandingScreen onGetStarted={() => setView('onboarding')} />;
  }

  if (view === 'onboarding') {
    return <OnboardingWizard onComplete={() => setView('app')} />;
  }

  // App Layout
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {appTab === 'dashboard' && <Dashboard />}
        {appTab === 'quiz' && (
          <div className="p-4 h-full flex items-center justify-center">
            <QuizFeed />
          </div>
        )}
        {appTab === 'schedule' && (
          <div className="p-4 h-full">
            <ScheduleBuilder />
          </div>
        )}
        {appTab === 'generate' && <GenerateContent />}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-white/10 z-50 flex justify-around items-center px-2 backdrop-blur-xl bg-black/40">
        <button 
          onClick={() => setAppTab('schedule')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${appTab === 'schedule' ? 'text-cyan-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Schedule</span>
        </button>

        <button 
          onClick={() => setAppTab('generate')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${appTab === 'generate' ? 'text-cyan-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
        >
          <Upload className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
        </button>

        <button 
          onClick={() => setAppTab('dashboard')}
          className="relative -top-6 group"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-cyan-500/20 ${appTab === 'dashboard' ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 scale-110' : 'bg-slate-800 border border-white/10 group-hover:scale-105'}`}>
            <HomeIcon className={`w-6 h-6 ${appTab === 'dashboard' ? 'text-white' : 'text-white/60'}`} />
          </div>
        </button>

        <button 
          onClick={() => setAppTab('quiz')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${appTab === 'quiz' ? 'text-cyan-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
        >
          <Brain className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Quiz</span>
        </button>
      </div>
    </div>
  );
}