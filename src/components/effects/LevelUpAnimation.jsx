import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import confetti from 'canvas-confetti';

export default function LevelUpAnimation({ show, level, onComplete }) {
  useEffect(() => {
    if (show) {
      soundManager.play('levelUp');
      
      // Confetti burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#d97706'],
      });

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-600 rounded-3xl p-12 shadow-2xl border-4 border-yellow-300"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <Sparkles className="w-12 h-12 text-white" />
                <Zap className="w-16 h-16 text-white" />
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-5xl font-black text-white mb-4">LEVEL UP!</h2>
              <div className="text-8xl font-black text-white mb-4">{level}</div>
              <p className="text-xl text-white/90 font-bold">You're getting stronger!</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}