import React, { useState } from 'react';
import LandingScreen from '@/components/LandingScreen';
import OnboardingWizard from '@/components/OnboardingWizard';
import { Button } from '@/components/ui/button'; // Keeping imports clean
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const [view, setView] = useState('landing'); // landing, onboarding, dashboard

  if (view === 'landing') {
    return <LandingScreen onGetStarted={() => setView('onboarding')} />;
  }

  if (view === 'onboarding') {
    return <OnboardingWizard onComplete={() => setView('dashboard')} />;
  }

  return <Dashboard />;
}