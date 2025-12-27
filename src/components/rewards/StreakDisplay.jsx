import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function StreakDisplay({ currentStreak = 0 }) {
  const getStreakLevel = (streak) => {
    if (streak >= 30) return { level: 'legendary', color: 'text-purple-400', glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]', size: 'w-8 h-8' };
    if (streak >= 14) return { level: 'master', color: 'text-pink-400', glow: 'drop-shadow-[0_0_12px_rgba(244,114,182,0.7)]', size: 'w-7 h-7' };
    if (streak >= 7) return { level: 'pro', color: 'text-orange-400', glow: 'drop-shadow-[0_0_10px_rgba(251,146,60,0.6)]', size: 'w-6 h-6' };
    if (streak >= 3) return { level: 'starter', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]', size: 'w-5 h-5' };
    return { level: 'beginner', color: 'text-gray-400', glow: '', size: 'w-4 h-4' };
  };

  const streakData = getStreakLevel(currentStreak);

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="glass px-3 md:px-4 py-2 md:py-2 rounded-full flex items-center gap-2 relative"
    >
      <motion.div
        animate={currentStreak > 0 ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 2
        }}
      >
        <Flame 
          className={`${streakData.size} ${streakData.color} ${streakData.glow} fill-current`}
        />
      </motion.div>
      <span className="font-bold text-sm md:text-base">{currentStreak}</span>
      
      {currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-1.5 py-0.5 text-[8px] font-black text-white"
        >
          {streakData.level.toUpperCase()}
        </motion.div>
      )}
    </motion.div>
  );
}