import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Trophy, Flame, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

export default function RandomEventBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: activeEvents = [] } = useQuery({
    queryKey: ['randomEvents'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const now = moment();
      
      const events = await base44.entities.RandomEvent.filter({ 
        created_by: user.email,
        isActive: true
      });
      
      // Filter to only show non-expired events
      return events.filter(event => {
        if (!event.expiresAt) return true;
        return moment(event.expiresAt).isAfter(now);
      });
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const currentEvent = activeEvents[0];

  if (!currentEvent || dismissed) return null;

  const getIcon = () => {
    switch (currentEvent.type) {
      case 'doubleXP': return <Zap className="w-6 h-6" />;
      case 'lightning': return <Sparkles className="w-6 h-6" />;
      case 'bonusChallenge': return <Trophy className="w-6 h-6" />;
      case 'streakBonus': return <Flame className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const timeLeft = currentEvent.expiresAt 
    ? moment(currentEvent.expiresAt).diff(moment(), 'minutes')
    : currentEvent.durationMinutes;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] max-w-md w-full px-4"
      >
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl shadow-2xl p-4 border-2 border-white/20">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-white animate-pulse">
              {currentEvent.emoji ? <span className="text-3xl">{currentEvent.emoji}</span> : getIcon()}
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{currentEvent.title}</h3>
              <p className="text-white/90 text-sm">{currentEvent.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/80 text-xs font-bold">{timeLeft} min left</span>
                {currentEvent.multiplier > 1 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {currentEvent.multiplier}x XP
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}