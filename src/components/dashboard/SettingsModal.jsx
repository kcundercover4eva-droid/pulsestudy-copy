import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sun, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const THEMES = [
  { id: 'coral', name: 'Coral Crush', gradient: 'from-rose-400 to-orange-300', color: '#fb7185' },
  { id: 'neonGreen', name: 'Neon Focus', gradient: 'from-green-400 to-emerald-300', color: '#4ade80' },
  { id: 'electricBlue', name: 'Electric Mind', gradient: 'from-cyan-400 to-blue-500', color: '#22d3ee' },
];

const COMMITMENT_LEVELS = [
  { id: 'casual', label: 'Casual', hours: 5, desc: 'Just testing the waters.' },
  { id: 'balanced', label: 'Balanced', hours: 10, desc: 'School, life, and good grades.' },
  { id: 'serious', label: 'Serious', hours: 20, desc: 'I need those A\'s.' },
  { id: 'machine', label: 'Machine', hours: 30, desc: 'Top of the class. No excuses.' }
];

export default function SettingsModal({ isOpen, onClose, userProfile, onSave }) {
  const [settings, setSettings] = useState({
    accentColor: userProfile?.accentColor || 'neonGreen',
    motivationStyle: userProfile?.motivationStyle || 'positive',
    commitmentLevel: userProfile?.commitmentLevel || 'balanced',
    weeklyGoalHours: userProfile?.weeklyGoalHours || 10
  });

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Color Theme */}
          <div>
            <h3 className="text-lg font-bold mb-3">Color Theme</h3>
            <div className="grid grid-cols-1 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('accentColor', theme.id)}
                  className={`relative overflow-hidden rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${
                    settings.accentColor === theme.id 
                      ? 'ring-2 ring-white scale-[1.02] bg-white/10' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.gradient} shadow-lg`} />
                    <span className="font-bold text-lg">{theme.name}</span>
                  </div>
                  {settings.accentColor === theme.id && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Commitment Level */}
          <div>
            <h3 className="text-lg font-bold mb-3">Commitment Level</h3>
            <div className="grid grid-cols-1 gap-2">
              {COMMITMENT_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    updateSetting('commitmentLevel', level.id);
                    updateSetting('weeklyGoalHours', level.hours);
                  }}
                  className={`relative overflow-hidden rounded-xl p-3 flex items-center justify-between transition-all duration-300 ${
                    settings.commitmentLevel === level.id 
                      ? 'bg-white text-slate-900 scale-[1.02]' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="font-bold text-base text-left">{level.label}</div>
                    <div className={`text-sm text-left ${
                      settings.commitmentLevel === level.id ? 'text-slate-600' : 'text-white/50'
                    }`}>
                      {level.desc}
                    </div>
                  </div>
                  {settings.commitmentLevel === level.id && <Target className="w-5 h-5 text-cyan-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Coaching Style */}
          <div>
            <h3 className="text-lg font-bold mb-3">Coaching Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('motivationStyle', 'positive')}
                className={`rounded-xl p-4 flex flex-col items-center gap-3 text-center transition-all ${
                  settings.motivationStyle === 'positive' 
                    ? 'bg-green-500/20 border-2 border-green-500/50' 
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">Positive Vibes</h4>
                  <p className="text-sm text-white/60">"You're doing great! Keep the streak alive!"</p>
                </div>
              </button>

              <button
                onClick={() => updateSetting('motivationStyle', 'negative')}
                className={`rounded-xl p-4 flex flex-col items-center gap-3 text-center transition-all ${
                  settings.motivationStyle === 'negative' 
                    ? 'bg-red-500/20 border-2 border-red-500/50' 
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">Hard Truths</h4>
                  <p className="text-sm text-white/60">"Do you want to fail? Get back to work."</p>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1 border-white/20">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-white text-slate-900 hover:bg-white/90 font-bold">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}