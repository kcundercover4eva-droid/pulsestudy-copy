import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const steps = [
  {
    id: 1,
    message: "Glad ur here.",
    type: "fullscreen",
    showConfetti: true
  },
  {
    id: 2,
    message: "To start, customize ur schedule",
    targetSelector: '[data-tab="schedule"]',
    type: "pointer"
  },
  {
    id: 3,
    message: "AI quiz, flashcards, notes - all here",
    targetSelector: '[data-tab="study"]',
    type: "pointer"
  },
  {
    id: 4,
    message: "Upload material here to generate study content!",
    targetSelector: '[data-tab="generate"]',
    type: "pointer"
  },
  {
    id: 5,
    message: "keep a streak cuz why not",
    targetSelector: '[data-guide="streak"]',
    type: "pointer"
  },
  {
    id: 6,
    message: "Ahhh, the timer",
    targetSelector: '[data-guide="timer"]',
    type: "pointer"
  },
  {
    id: 7,
    message: "AI tutor- to HELP not DO IT FOR U",
    targetSelector: '[data-guide="assistant"]',
    type: "pointer"
  }
];

export default function FirstTimeGuide({ currentStep, onNext, onComplete }) {
  const step = steps[currentStep - 1];
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (step?.showConfetti) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.4 }
          });
        }, 200);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step?.showConfetti]);

  // Update target element rect
  useEffect(() => {
    if (!step || step.type === "fullscreen") return;
    
    const updateRect = () => {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [step]);

  if (!step) return null;

  // Fullscreen welcome step
  if (step.type === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="mb-8"
          >
            <Sparkles className="w-24 h-24 mx-auto text-yellow-400" />
          </motion.div>
          <h1 className="text-6xl font-black text-white mb-8">{step.message}</h1>
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform text-xl h-16 px-12 rounded-2xl"
          >
            Let's go 🚀
          </Button>
        </motion.div>
      </div>
    );
  }

  // Get tooltip position and arrow direction
  const getPositionAndArrow = () => {
    if (!targetRect) return { position: {}, arrow: null };

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if target is in bottom navigation area (bottom 200px)
    const isBottomNav = targetRect.bottom > viewportHeight - 200;

    // For bottom navigation items - position ABOVE
    if (isBottomNav) {
      const centerX = targetRect.left + targetRect.width / 2;
      const left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - padding));
      return {
        position: {
          bottom: viewportHeight - targetRect.top + 20,
          left: left
        },
        arrow: null
      };
    }

    // For top elements (top 150px) - position BELOW
    if (targetRect.top < 150) {
      const centerX = targetRect.left + targetRect.width / 2;
      const left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - padding));
      return {
        position: {
          top: targetRect.bottom + 20,
          left: left
        },
        arrow: null
      };
    }

    // For middle elements - try right, then below, then above
    const fitsOnRight = targetRect.right + tooltipWidth + padding < viewportWidth;
    const fitsBelow = targetRect.bottom + tooltipHeight + padding < viewportHeight - 160;

    if (fitsOnRight) {
      const top = Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - 160));
      return {
        position: {
          top: top,
          left: targetRect.right + 20
        },
        arrow: null
      };
    } else if (fitsBelow) {
      const centerX = targetRect.left + targetRect.width / 2;
      const left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - padding));
      return {
        position: {
          top: targetRect.bottom + 20,
          left: left
        },
        arrow: null
      };
    } else {
      const centerX = targetRect.left + targetRect.width / 2;
      const left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - padding));
      return {
        position: {
          bottom: viewportHeight - targetRect.top + 20,
          left: left
        },
        arrow: null
      };
    }
  };

  const { position, arrow } = getPositionAndArrow();

  // Calculate arrow position to point at target center
  const getArrowPosition = () => {
    if (!targetRect) return null;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const viewportHeight = window.innerHeight;

    // Check if target is in bottom nav
    const isBottomNav = targetRect.bottom > viewportHeight - 200;
    
    // Check if target is in top area
    const isTopArea = targetRect.top < 150;

    if (isBottomNav) {
      // Arrow should point down at target from above
      return (
        <div 
          className="fixed z-[101] pointer-events-none"
          style={{
            left: targetCenterX,
            top: targetRect.top - 30,
            transform: 'translateX(-50%)'
          }}
        >
          <ArrowDown className="w-10 h-10 text-purple-400 animate-bounce drop-shadow-lg" />
        </div>
      );
    }
    
    if (isTopArea) {
      // Arrow should point up at target from below
      return (
        <div 
          className="fixed z-[101] pointer-events-none"
          style={{
            left: targetCenterX,
            top: targetRect.bottom + 30,
            transform: 'translateX(-50%)'
          }}
        >
          <ArrowUp className="w-10 h-10 text-purple-400 animate-bounce drop-shadow-lg" />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Highlight target element */}
      {targetRect && (
        <>
          {/* Pulsing ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="fixed z-[92] rounded-2xl pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              border: '4px solid rgb(168,85,247)',
              boxShadow: '0 0 40px 10px rgba(168,85,247,0.8), inset 0 0 40px 10px rgba(168,85,247,0.3)'
            }}
          />
        </>
      )}

      {/* Arrow pointing at target */}
      {getArrowPosition()}

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[100] rounded-2xl p-6 w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border-2 border-purple-500/50 shadow-2xl"
        style={position}
      >
        
        <p className="text-white text-lg font-bold mb-4 text-center leading-tight drop-shadow-lg">
          {step.message}
        </p>
        
        <div className="flex gap-3">
          {currentStep < steps.length ? (
            <Button
              onClick={onNext}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform h-12 font-bold"
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105 transition-transform h-12 font-bold"
            >
              Got it! ✓
            </Button>
          )}
        </div>
        
        <div className="flex justify-center gap-1.5 mt-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === currentStep ? 'bg-purple-400 w-8' : 'bg-white/30 w-2'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}