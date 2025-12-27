import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Star, Zap, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const BOX_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-yellow-600',
  legendary: 'from-purple-500 via-pink-500 to-orange-500'
};

export default function MysteryBoxUnbox({ box, onClose }) {
  const [isOpening, setIsOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const queryClient = useQueryClient();

  const openBoxMutation = useMutation({
    mutationFn: async () => {
      // Mark box as opened
      await base44.entities.MysteryBox.update(box.id, { isOpened: true });
      
      // Award contents to user
      const userProfiles = await base44.entities.UserProfile.list();
      const profile = userProfiles[0];
      
      if (profile && box.contents) {
        const updates = {};
        if (box.contents.xp) updates.totalPoints = (profile.totalPoints || 0) + box.contents.xp;
        if (box.contents.currency) updates.currency = (profile.currency || 0) + box.contents.currency;
        
        if (Object.keys(updates).length > 0) {
          await base44.entities.UserProfile.update(profile.id, updates);
        }
      }
      
      return box.contents;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mysteryBoxes']);
      queryClient.invalidateQueries(['userProfile']);
    }
  });

  const handleOpen = async () => {
    setIsOpening(true);
    
    // Play animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Open the box
    await openBoxMutation.mutateAsync();
    
    // Reveal contents
    setRevealed(true);
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4 }
      });
    }, 300);
  };

  if (!box) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={revealed ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="relative max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {!revealed ? (
          <div className="text-center">
            <motion.div
              animate={isOpening ? {
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1.1, 1.3]
              } : {}}
              transition={{ duration: 2 }}
              className={`w-48 h-48 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${BOX_COLORS[box.type]} shadow-2xl flex items-center justify-center relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <Gift className="w-24 h-24 text-white" />
              {box.type === 'legendary' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="absolute top-4 left-4 w-6 h-6 text-white" />
                  <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-white" />
                  <Star className="absolute top-4 right-4 w-6 h-6 text-white" />
                  <Star className="absolute bottom-4 left-4 w-6 h-6 text-white" />
                </motion.div>
              )}
            </motion.div>
            
            <h2 className="text-3xl font-bold text-white mb-2 capitalize">{box.type} Crate!</h2>
            <p className="text-white/60 mb-6">{box.earnedFrom || 'You earned this reward'}</p>
            
            <Button
              onClick={handleOpen}
              disabled={isOpening}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              {isOpening ? 'Opening...' : 'Open Crate'}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-8 text-center"
          >
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">You Got:</h2>
            
            <div className="space-y-3 mb-6">
              {box.contents.xp > 0 && (
                <div className="flex items-center justify-center gap-3 text-xl">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-white font-bold">+{box.contents.xp} XP</span>
                </div>
              )}
              {box.contents.currency > 0 && (
                <div className="flex items-center justify-center gap-3 text-xl">
                  <span className="text-2xl">💎</span>
                  <span className="text-white font-bold">+{box.contents.currency} Coins</span>
                </div>
              )}
              {box.contents.streakFreeze > 0 && (
                <div className="flex items-center justify-center gap-3 text-xl">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-white font-bold">{box.contents.streakFreeze}x Streak Freeze</span>
                </div>
              )}
              {box.contents.cosmeticIds?.length > 0 && (
                <div className="flex items-center justify-center gap-3 text-xl">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <span className="text-white font-bold">{box.contents.cosmeticIds.length} Cosmetic Item(s)</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={onClose}
              className="w-full bg-white text-black font-bold"
            >
              Awesome!
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}