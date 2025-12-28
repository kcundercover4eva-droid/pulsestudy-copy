import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, Award, Sparkles, X, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const MOTIVATIONAL_LINES = [
  "Every streak starts with one session.",
  "Turn distraction into discipline.",
  "Your focus, your future.",
  "Study smarter. Unlock your potential.",
  "Block the noise. Build the streak.",
  "Own your focus.",
  "One session closer to success.",
  "Stay sharp. Stay unstoppable.",
  "Small wins build big futures.",
  "Your brain deserves a break from distractions.",
  "Consistency beats cramming.",
  "Focus is your superpower.",
  "Study today, shine tomorrow."
];

const GAMIFIED_LINES = [
  "Ready to level up your focus?",
  "Let’s beat distractions together!",
  "Streak mode unlocked—don’t break it!",
  "Tap start to earn your first points.",
  "Focus shield charging…",
  "Your next badge is waiting."
];

const COLORS = {
  coral: "from-rose-400 to-orange-300",
  neonGreen: "from-green-400 to-emerald-300",
  electricBlue: "from-cyan-400 to-blue-500",
  default: "from-indigo-500 via-purple-500 to-pink-500"
};

export default function LandingScreen({ onGetStarted }) {
  const [showXP, setShowXP] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Champion';

  // XP popup animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowXP(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#06b6d4', '#ec4899', '#fbbf24']
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Progress bar animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(12);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-sans">
      
      {/* Animated Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Glowing Streaks */}
        <motion.div 
          animate={{ 
            x: ['-100%', '200%'],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
          className="absolute top-1/4 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"
        />
        <motion.div 
          animate={{ 
            x: ['200%', '-100%'],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatDelay: 1,
            delay: 1
          }}
          className="absolute top-3/4 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent blur-sm"
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 50}%`
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* Mascot Icon with Glow */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1, delay: 0.2 }}
          className="mb-6 relative"
        >
          <div className="absolute inset-0 bg-yellow-400/40 blur-3xl rounded-full animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-2xl border-4 border-white/30">
            <Zap className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* XP Achievement Popup */}
        <AnimatePresence>
          {showXP && (
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="mb-8 relative"
            >
              <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-2xl" />
              <div className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl border-2 border-white/50 shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <Award className="w-8 h-8 text-yellow-300" strokeWidth={2.5} />
                  <span className="text-2xl font-black tracking-tight">+10 Focus XP</span>
                </motion.div>
                <p className="text-sm font-semibold mt-1 text-cyan-100">You showed up! 🎉</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personalized Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-2xl">
            Ready to level up,
          </h1>
          <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
            {firstName}?
          </h2>
        </motion.div>

        {/* Main CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="mb-6 relative w-full max-w-xs"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 blur-xl opacity-60 animate-pulse" />
          <Button 
            onClick={onGetStarted}
            className="relative w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-500 hover:scale-105 transition-transform shadow-2xl border-2 border-white/50"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Start Your Focus Quest
            <TrendingUp className="w-6 h-6 ml-2" />
          </Button>
        </motion.div>

        {/* Animated Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="w-full max-w-xs"
        >
          <div className="flex justify-between text-xs font-bold mb-2 text-cyan-100">
            <span>Today's Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/20 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 relative overflow-hidden"
            >
              <motion.div
                animate={{ x: ['0%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Learn More Link */}
        <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="mt-8 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm"
            >
              Learn More
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none overflow-hidden text-white">
            <LearnMoreCarousel onClose={() => setShowLearnMore(false)} />
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

function LearnMoreCarousel({ onClose }) {
  const [slide, setSlide] = useState(0);
  const [showScreenagers, setShowScreenagers] = useState(false);
  const [showSlide3Text, setShowSlide3Text] = useState(0);

  const totalSlides = 3;

  const nextSlide = () => {
    if (slide < totalSlides - 1) {
      setSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="relative w-full h-[600px] md:h-[500px] glass rounded-3xl overflow-hidden flex flex-col shadow-2xl bg-slate-900/90 border border-white/20">
      
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </button>

      {/* Slide Content */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative">
        <AnimatePresence mode="wait">
          
          {/* SLIDE 1 */}
          {slide === 0 && (
            <motion.div 
              key="slide1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <p className="text-xl mb-6 font-medium text-purple-200">While ur peers are busy being</p>
              
              <div 
                onClick={() => setShowScreenagers(true)}
                className="relative cursor-pointer group mb-4"
              >
                {/* Placeholder for phone screen - CSS Phone */}
                <div className="w-32 h-56 rounded-[2rem] border-4 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl transform transition-transform group-hover:scale-105 group-active:scale-95">
                   {!showScreenagers ? (
                     <div className="text-4xl">📱</div>
                   ) : (
                     <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                       <span className="text-2xl">👀</span>
                     </div>
                   )}
                </div>
                
                {/* Floating Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                  {showScreenagers && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-3xl font-black text-red-400 bg-black/80 px-2 py-1 rotate-[-15deg] backdrop-blur-sm"
                    >
                      SCREENAGERS
                    </motion.div>
                  )}
                </div>
              </div>

              {showScreenagers && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-white/40 font-mono mt-2"
                >
                  (sry if i called u out)
                </motion.p>
              )}
            </motion.div>
          )}

          {/* SLIDE 2 */}
          {slide === 1 && (
            <motion.div 
              key="slide2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full h-full flex flex-col items-center justify-center px-4"
            >
               <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold leading-relaxed"
               >
                 <span className="text-white">U will be getting </span>
                 <span className="text-green-400 text-3xl block my-2">GREAT GRADES</span>
                 <span className="text-white">and lowk </span>
                 <span className="text-cyan-400 block my-2">ELIMINATE SCHOOL STRESS</span>
               </motion.div>
               
               <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-white/60 text-lg"
               >
                 bc in all honestly school <br/>
                 <span className="text-red-400 font-bold decoration-wavy underline decoration-red-400/50">DOES NOT</span> need to be stressful.
               </motion.p>
            </motion.div>
          )}

          {/* SLIDE 3 */}
          {slide === 2 && (
            <motion.div 
              key="slide3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              onClick={() => setShowSlide3Text(prev => prev + 1)}
              className="w-full h-full flex flex-col items-center justify-center text-left space-y-4 cursor-pointer"
            >
              {showSlide3Text >= 0 && (
                <motion.p className="text-white/80 w-full bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-xs text-white/40 uppercase tracking-widest block mb-1">(Maybe) You:</span>
                  But I procrastinate and mostly get it done ok.
                </motion.p>
              )}

              {showSlide3Text >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/20"
                >
                  <span className="text-xs text-cyan-400/60 uppercase tracking-widest block mb-1">Me:</span>
                  <p className="text-cyan-100">Well. GUESS WHAT? Waiting 1-2 days before a deadline to start is NOT GONNA FLY IN...</p>
                </motion.div>
              )}

              {showSlide3Text >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 2, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  className="py-4"
                >
                  <div className="text-center font-black text-2xl text-yellow-300 animate-pulse">
                    -*-*-*- the real world -*-*-*-
                  </div>
                  <div className="text-xs text-center text-yellow-300/50 mt-1">*cue magical, in-awe sounds*</div>
                </motion.div>
              )}

              {showSlide3Text >= 3 && (
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-sm text-white/50 text-center px-4"
                >
                  (cuz u, like prolly need that job… lol. Either that or spend ur life in a better way than doomscrolling. MOREOVER, teenage years are the foundational years and if YOU succeed during the teens, the rest of ur life will be lived happily-enns. :)
                </motion.p>
              )}
              
              {showSlide3Text === 0 && <p className="text-xs text-white/30 animate-bounce mt-4">Tap to continue...</p>}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-white/10 flex justify-between items-center bg-black/20">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === slide ? 'bg-cyan-400 w-6' : 'bg-white/20'}`}
            />
          ))}
        </div>
        <Button 
          onClick={nextSlide}
          size="sm"
          className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
        >
          {slide === totalSlides - 1 ? 'Got it' : 'Next'}
        </Button>
      </div>
    </div>
  );
}