import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Flame, Shield, Coffee, ArrowRight, Check } from 'lucide-react';

export default function SessionSummary({ data, onContinue, onFinish }) {
  const { duration, pointsEarned, pauseCount, distractionAttempts, isPerfect, streak } = data;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-yellow-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white text-center mb-2"
        >
          {isPerfect ? 'Perfect Session!' : 'Session Complete!'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-center mb-8"
        >
          {isPerfect 
            ? "🎯 Flawless focus! You're unstoppable!"
            : "Great work! Every session builds momentum! 🚀"}
        </motion.p>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 mb-6"
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Time */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{duration}m</div>
              <div className="text-xs text-white/60">Focus Time</div>
            </div>

            {/* Points */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">+{pointsEarned}</div>
              <div className="text-xs text-white/60">Points Earned</div>
            </div>

            {/* Streak */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white">{streak}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </div>

            {/* Perfect Badge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                {isPerfect ? <Shield className="w-6 h-6 text-green-400" /> : <Check className="w-6 h-6 text-white/40" />}
              </div>
              <div className="text-3xl font-bold text-white">{isPerfect ? '✓' : pauseCount}</div>
              <div className="text-xs text-white/60">{isPerfect ? 'Perfect!' : 'Pauses'}</div>
            </div>
          </div>
        </motion.div>

        {/* Perfect Session Badge */}
        {isPerfect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-4 mb-6 border-2 border-yellow-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-bold">Perfect Session Bonus!</div>
                <div className="text-white/60 text-sm">+50 bonus points for zero distractions</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Encouraging Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-4 mb-6"
        >
          <p className="text-white/80 text-center text-sm leading-relaxed">
            {isPerfect 
              ? "🌟 You just proved that deep focus is your superpower! This is what champions do."
              : pauseCount === 0
              ? "💪 Zero pauses! Your focus game is leveling up fast!"
              : pauseCount <= 2
              ? "🎯 Solid session! You're building incredible mental endurance."
              : "✨ Every session makes you stronger. Keep going!"}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full rounded-2xl h-14 font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform"
          >
            <Coffee className="w-5 h-5 mr-2" />
            Take a Break
          </Button>
          
          <Button
            onClick={onFinish}
            size="lg"
            variant="outline"
            className="w-full rounded-2xl h-14 font-bold border-white/20 hover:bg-white/5"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}