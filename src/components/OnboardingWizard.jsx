import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check, Sun, Moon, Zap, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const STEPS = [
  { id: 'color', title: 'Vibe Check' },
  { id: 'commitment', title: 'Commitment' },
  { id: 'tone', title: 'Coaching Style' }
];

const THEMES = [
  { id: 'coral', name: 'Coral Crush', gradient: 'from-rose-400 to-orange-300', color: '#fb7185' },
  { id: 'neonGreen', name: 'Neon Focus', gradient: 'from-green-400 to-emerald-300', color: '#4ade80' },
  { id: 'electricBlue', name: 'Electric Mind', gradient: 'from-cyan-400 to-blue-500', color: '#22d3ee' },
];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    accentColor: 'neonGreen',
    motivationStyle: 'positive',
    commitmentLevel: 'balanced', // casual, balanced, serious, machine
    weeklyGoalHours: 10
  });

  const COMMITMENT_LEVELS = [
    { id: 'casual', label: 'Casual', hours: 5, desc: 'Just testing the waters.' },
    { id: 'balanced', label: 'Balanced', hours: 10, desc: 'School, life, and good grades.' },
    { id: 'serious', label: 'Serious', hours: 20, desc: 'I need those A\'s.' },
    { id: 'machine', label: 'Machine', hours: 30, desc: 'Top of the class. No excuses.' }
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      // In a real app we would update the user record
      // For now we just create a record to simulate
      return await base44.entities.UserProfile.create({
        ...profileData,
        email: 'current-user@example.com' // Placeholder
      });
    },
    onSuccess: () => {
      onComplete();
    }
  });

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      updateProfileMutation.mutate(data);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const update = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const currentTheme = THEMES.find(t => t.id === data.accentColor);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white p-3 relative overflow-hidden">
      
      {/* Background based on selection */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} opacity-20 blur-[100px] transition-all duration-700`} />

      <motion.div 
        className="relative z-10 w-full max-w-lg glass rounded-3xl p-6 md:p-10 max-h-[92vh] flex flex-col shadow-2xl border border-white/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Progress */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/20'}`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{STEPS[step].title}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* Step 0: Color Selection */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-7"
              >
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Pick your dopamine.</h2>
                  <p className="text-base text-white/60">This color will define your study vibe.</p>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => update('accentColor', theme.id)}
                      className={`relative overflow-hidden rounded-2xl p-5 flex items-center justify-between transition-all duration-300 ${data.accentColor === theme.id ? 'ring-2 ring-white scale-[1.02] bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${theme.gradient} shadow-lg`} />
                        <span className="font-bold text-xl">{theme.name}</span>
                      </div>
                      {data.accentColor === theme.id && <Check className="w-6 h-6" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Commitment */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">What type of commitment do you have?</h2>
                  <p className="text-sm text-white/60">We'll adapt the schedule to your pace.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {COMMITMENT_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => {
                        update('commitmentLevel', level.id);
                        update('weeklyGoalHours', level.hours);
                      }}
                      className={`relative overflow-hidden rounded-2xl p-3.5 flex items-center justify-between transition-all duration-300 ${data.commitmentLevel === level.id ? 'bg-white text-slate-900 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <div>
                        <div className="font-bold text-base text-left">{level.label}</div>
                        <div className={`text-sm text-left ${data.commitmentLevel === level.id ? 'text-slate-600' : 'text-white/50'}`}>
                          {level.desc}
                        </div>
                      </div>
                      {data.commitmentLevel === level.id && <Target className="w-5 h-5 text-cyan-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Tone */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">How should we push you?</h2>
                  <p className="text-sm text-white/60">Choose your coaching style.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => update('motivationStyle', 'positive')}
                    className={`rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all ${data.motivationStyle === 'positive' ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <Sun className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-1">Positive Vibes</h3>
                      <p className="text-sm text-white/60">"You're doing great! Keep the streak alive!"</p>
                    </div>
                  </button>

                  <button
                    onClick={() => update('motivationStyle', 'negative')}
                    className={`rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all ${data.motivationStyle === 'negative' ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-1">Hard Truths</h3>
                      <p className="text-sm text-white/60">"Do you want to fail? Get back to work."</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            onClick={back} 
            variant="ghost" 
            className={`text-white/50 hover:text-white ${step === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            onClick={next}
            className={`bg-white text-slate-900 hover:bg-white/90 font-bold px-8 rounded-xl text-base h-12`}
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
            {step !== STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

      </motion.div>
    </div>
  );
}