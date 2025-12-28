import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, Shield, Brain, Sparkles, X, Edit3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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
  const [currentLine, setCurrentLine] = useState(0);
  const [sublineType, setSublineType] = useState('gamified'); // 'motivational' or 'gamified'
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Show XP popup on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowXPPopup(true);
      setTimeout(() => setShowXPPopup(false), 3000);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(12);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Rotate lines
  useEffect(() => {
    const lines = sublineType === 'gamified' ? GAMIFIED_LINES : MOTIVATIONAL_LINES;
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % lines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sublineType]);

  const activeLines = sublineType === 'gamified' ? GAMIFIED_LINES : MOTIVATIONAL_LINES;
  const firstName = currentUser?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Electric Blue → Magenta Gradient Background with Streaks */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600 via-purple-600 to-fuchsia-600">
        {/* Energetic Streaks */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 animate-pulse" />
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-fuchsia-400/0 via-fuchsia-400/60 to-fuchsia-400/0 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_50%)]" />
        </div>
        {/* Motion-inspired Lighting */}
        <motion.div 
          animate={{ 
            x: ['-50%', '50%', '-50%'],
            y: ['-50%', '50%', '-50%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-cyan-400/20 blur-[120px]"
        />
      </div>

      {/* XP Achievement Popup */}
      <AnimatePresence>
        {showXPPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-4 rounded-2xl shadow-2xl border-2 border-yellow-300/50"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-white animate-spin" />
              <div className="text-center">
                <p className="text-white font-black text-xl">+10 Focus XP</p>
                <p className="text-white/90 text-sm">You showed up! 🔥</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* Logo/Brand with Micro-Animation Aura */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-4"
        >
          <div className="relative">
            {/* Particle Aura */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-400 blur-3xl"
            />
            {/* Subtle Level-Up Flash */}
            <motion.div
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0.8, 1.3, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 rounded-full bg-white blur-2xl"
            />
            
            <div className="relative w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 border-4 border-white shadow-2xl">
              <Zap className="w-12 h-12 text-white fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
          
          <motion.h1 
            animate={{ 
              textShadow: [
                '0 0 20px rgba(6,182,212,0.8)',
                '0 0 40px rgba(6,182,212,1)',
                '0 0 20px rgba(6,182,212,0.8)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-3 text-white drop-shadow-2xl"
          >
            PulseStudy
          </motion.h1>
          <p className="text-xl md:text-2xl font-bold text-white/90 tracking-wide drop-shadow-lg">
            Focus smarter. Study stronger.
          </p>
        </motion.div>

        {/* Personalized Welcome */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-cyan-300 mb-6 drop-shadow-lg"
        >
          Ready to level up, {firstName}? 🚀
        </motion.p>

        {/* Sleek Rotating Quote Module */}
        <div className="mb-10 w-full max-w-lg">
          <div className="glass-card rounded-2xl p-6 border-2 border-cyan-400/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Daily Motivation</div>
              <button 
                onClick={() => setSublineType(prev => prev === 'motivational' ? 'gamified' : 'motivational')}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
            
            <div className="h-16 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentLine + sublineType}
                  initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                  className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg"
                >
                  {sublineType === 'gamified' && <Sparkles className="w-5 h-5 text-yellow-400" />}
                  {activeLines[currentLine]}
                  {sublineType === 'gamified' && <Sparkles className="w-5 h-5 text-yellow-400" />}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Large Glowing CTA Button */}
        <div className="flex flex-col gap-4 w-full max-w-md mb-8">
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 40px rgba(6,182,212,0.6)',
                '0 0 60px rgba(6,182,212,1)',
                '0 0 40px rgba(6,182,212,0.6)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Button 
              onClick={onGetStarted}
              className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 hover:scale-105 active:scale-95 shadow-2xl border-2 border-white/30 transition-all"
            >
              <Zap className="w-6 h-6 mr-2 animate-pulse" />
              Start Your Focus Quest
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </motion.div>

          {/* Clean Learn More Button */}
          <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-12 rounded-2xl text-white font-semibold hover:bg-white/10 border border-white/20"
              >
                Learn More
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none overflow-hidden text-white">
              <LearnMoreCarousel onClose={() => setShowLearnMore(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Futuristic Progress Bar */}
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs font-bold text-cyan-300 mb-2">
            <span>Focus Level</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-cyan-400/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 relative"
            >
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
            </motion.div>
          </div>
        </div>

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