import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function DailyGoalRing({ userProfile, themeColor }) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = userProfile?.lastReviewDate;
  const count = lastDate === today ? (userProfile?.dailyReviewCount || 0) : 0;
  const target = userProfile?.dailyGoalTarget || 10;
  const percent = Math.min(100, (count / target) * 100);
  const isComplete = count >= target;

  const prevCountRef = useRef(count);
  useEffect(() => {
    if (count >= target && prevCountRef.current < target) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      toast.success('🎯 Daily goal smashed! You reviewed all your items today!');
    }
    prevCountRef.current = count;
  }, [count, target]);

  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const colorMap = { green: '#4ade80', rose: '#fb7185', cyan: '#22d3ee' };
  const color = colorMap[themeColor] || '#4ade80';

  return (
    <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-4 md:gap-6">
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {isComplete ? (
            <span className="text-2xl">🎯</span>
          ) : (
            <>
              <span className="text-xl font-black text-white">{count}</span>
              <span className="text-[10px] text-white/40">/{target}</span>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4" style={{ color }} />
          <h4 className="text-sm md:text-base font-bold text-white">Daily Study Goal</h4>
        </div>
        {isComplete ? (
          <p className="text-sm text-white/70 font-semibold" style={{ color }}>Goal complete! You crushed it today 🔥</p>
        ) : (
          <p className="text-sm text-white/60">
            {count === 0
              ? `Review ${target} cards, notes, or quizzes today`
              : `${target - count} more to hit your goal!`}
          </p>
        )}
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}