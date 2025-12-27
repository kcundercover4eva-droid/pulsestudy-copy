import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Flame } from 'lucide-react';

export default function XPPopup({ show, xp, isCritical, onComplete }) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: -20, opacity: 0 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none"
        >
          <div className={`${isCritical ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-2xl font-black`}>
            {isCritical ? (
              <>
                <Sparkles className="w-8 h-8 animate-pulse" />
                <span className="animate-pulse">CRITICAL HIT!</span>
              </>
            ) : (
              <Zap className="w-6 h-6" />
            )}
            <span>+{xp} XP</span>
            {isCritical && <Flame className="w-8 h-8 animate-pulse" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}