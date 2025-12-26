import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Coffee, Play, Pause, FastForward, Sparkles } from 'lucide-react';

const BREAK_SUGGESTIONS = [
  { emoji: '🚶', text: 'Take a short walk', desc: 'Get your blood flowing' },
  { emoji: '💧', text: 'Drink some water', desc: 'Stay hydrated' },
  { emoji: '🧘', text: 'Do a quick stretch', desc: 'Relax your muscles' },
  { emoji: '👀', text: 'Rest your eyes', desc: 'Look away from screens' },
  { emoji: '🌬️', text: 'Take deep breaths', desc: 'Calm your mind' },
  { emoji: '🍎', text: 'Grab a healthy snack', desc: 'Fuel your brain' },
];

export default function BreakTimer({ timeLeft, isActive, onPause, onResume, onSkip, soundEnabled }) {
  const [currentSuggestion, setCurrentSuggestion] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % BREAK_SUGGESTIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const suggestion = BREAK_SUGGESTIONS[currentSuggestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-400 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
        >
          <Coffee className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white mb-2">Break Time!</h1>
        <p className="text-white/60 mb-8">Recharge for your next focus session</p>

        {/* Timer */}
        <div className="glass rounded-3xl p-8 mb-6">
          <div className="text-7xl font-black text-white mb-2 tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-white/60">Time Remaining</div>
        </div>

        {/* Suggestion Card */}
        <motion.div
          key={currentSuggestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">{suggestion.emoji}</div>
            <div className="text-left flex-1">
              <div className="text-white font-bold text-lg">{suggestion.text}</div>
              <div className="text-white/60 text-sm">{suggestion.desc}</div>
            </div>
          </div>
        </motion.div>

        {/* Suggestion Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {BREAK_SUGGESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSuggestion ? 'bg-white w-6' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {isActive ? (
            <Button
              onClick={onPause}
              size="lg"
              className="flex-1 rounded-2xl h-14 font-bold bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              onClick={onResume}
              size="lg"
              className="flex-1 rounded-2xl h-14 font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
          )}
          
          <Button
            onClick={onSkip}
            size="lg"
            variant="outline"
            className="flex-1 rounded-2xl h-14 font-bold border-white/20 hover:bg-white/5"
          >
            <FastForward className="w-5 h-5 mr-2" />
            Skip Break
          </Button>
        </div>

        {/* Encouragement */}
        <div className="mt-6 text-white/60 text-sm">
          <Sparkles className="w-4 h-4 inline mr-1" />
          You earned this break! Relax and recharge 🌟
        </div>
      </motion.div>
    </div>
  );
}