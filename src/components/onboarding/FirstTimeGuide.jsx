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
    targetTab: "schedule",
    type: "pointer"
  },
  {
    id: 3,
    message: "to use ai quiz, note features etc. then upload material here",
    targetTab: "study",
    type: "pointer"
  },
  {
    id: 4,
    message: "keep a streak cuz why not",
    targetElement: "streak",
    type: "pointer"
  },
  {
    id: 5,
    message: "Ahhh, the timer",
    targetElement: "timer",
    type: "pointer"
  },
  {
    id: 6,
    message: "AI tutor- to HELP not DO IT FOR U",
    targetElement: "assistant",
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
      let element = null;
      if (step.targetTab === "schedule") {
        element = document.querySelector('[data-tab="schedule"]');
      } else if (step.targetTab === "study") {
        element = document.querySelector('[data-tab="study"]');
      } else if (step.targetElement) {
        element = document.querySelector(`[data-guide="${step.targetElement}"]`);
      }
      
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
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

    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    
    // For nav tabs (schedule/study) - position above
    if (step.targetTab === "schedule" || step.targetTab === "study") {
      return {
        position: {
          bottom: window.innerHeight - targetRect.top + 20,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        },
        arrow: <ArrowDown className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-10 h-10 text-purple-400 animate-bounce" />
      };
    }

    // For streak - position below
    if (step.targetElement === "streak") {
      return {
        position: {
          top: targetRect.bottom + 20,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        },
        arrow: <ArrowUp className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-purple-400 animate-bounce" />
      };
    }

    // For timer and assistant - check if they fit on the right, otherwise position above
    if (step.targetElement === "timer" || step.targetElement === "assistant") {
      const fitsOnRight = targetRect.right + tooltipWidth + padding < window.innerWidth;
      
      if (fitsOnRight) {
        return {
          position: {
            top: Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
            left: targetRect.right + 20
          },
          arrow: <ArrowLeft className="absolute left-[-40px] top-1/2 -translate-y-1/2 w-10 h-10 text-purple-400 animate-pulse" />
        };
      } else {
        return {
          position: {
            bottom: window.innerHeight - targetRect.top + 20,
            left: '50%',
            transform: 'translateX(-50%)'
          },
          arrow: <ArrowDown className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-10 h-10 text-purple-400 animate-bounce" />
        };
      }
    }

    return { position: {}, arrow: null };
  };

  const { position, arrow } = getPositionAndArrow();

  return (
    <>
      {/* Dark overlay with cutout for target */}
      <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm pointer-events-none" />
      
      {/* Spotlight on target element */}
      {targetRect && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed z-[95] rounded-2xl pointer-events-auto"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.8), 0 0 60px 20px rgba(168,85,247,0.6)',
              border: '3px solid rgba(168,85,247,0.8)'
            }}
          />
          
          {/* Pulsing ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="fixed z-[94] rounded-2xl pointer-events-none"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              border: '2px solid rgb(168,85,247)'
            }}
          />
        </>
      )}
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[100] glass-card rounded-2xl p-6 w-80 max-w-[90vw]"
        style={position}
      >
        {arrow}
        
        <p className="text-white text-lg font-bold mb-4 text-center leading-tight">
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