import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, BookOpen, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function FirstUploadCelebration({ isOpen, onClose, onGoStudy }) {
  useEffect(() => {
    if (isOpen) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.3 } }), 500);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm glass-card rounded-3xl p-1 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-[1.4rem] p-6 text-center">
              {/* Glow orb */}
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2">New Feature Unlocked! 🎉</h2>
              <p className="text-white/70 text-sm mb-5 leading-relaxed">
                Your study material is ready! You've unlocked your personalized study hub — quiz yourself, review flashcards, and read notes made just from your upload.
              </p>

              {/* CTA options */}
              <div className="space-y-3 mb-5">
                <button
                  onClick={() => onGoStudy('quiz')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Take a Quiz</div>
                    <div className="text-white/50 text-xs">Test your knowledge & earn XP</div>
                  </div>
                </button>
                <button
                  onClick={() => onGoStudy('flashcards')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Review Flashcards</div>
                    <div className="text-white/50 text-xs">Swipe through your key concepts</div>
                  </div>
                </button>
                <button
                  onClick={() => onGoStudy('notes')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Read Notes</div>
                    <div className="text-white/50 text-xs">Scan summaries at a glance</div>
                  </div>
                </button>
              </div>

              <Button
                onClick={onClose}
                variant="ghost"
                className="text-white/50 hover:text-white text-sm"
              >
                I'll explore on my own
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}