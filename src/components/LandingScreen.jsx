import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, Shield, Brain, Sparkles, X, Edit2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
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

const MOTIVATIONAL_QUOTES = [
  "Your focus shapes your future.",
  "Small daily wins build massive success.",
  "Block the noise. Own the moment.",
  "Discipline today. Freedom tomorrow.",
  "Every session counts. Every streak matters.",
  "You're one study session away from progress."
];

const COLORS = {
  coral: "from-rose-400 to-orange-300",
  neonGreen: "from-green-400 to-emerald-300",
  electricBlue: "from-cyan-400 to-blue-500",
  default: "from-indigo-500 via-purple-500 to-pink-500"
};

export default function LandingScreen({ onGetStarted }) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showXPBanner, setShowXPBanner] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userName, setUserName] = useState('Friend');

  // Get user name
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.full_name) {
        setUserName(user.full_name.split(' ')[0]);
      }
    }).catch(() => {});
  }, []);

  // Show XP banner after short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowXPBanner(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 12) {
            clearInterval(interval);
            return 12;
          }
          return prev + 1;
        });
      }, 80);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 font-sans">
      
      {/* Airy Depth Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-300/30 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-purple-200/25 to-pink-200/25 blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-green-200/20 to-emerald-200/20 blur-[80px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* PulseStudy Wordmark */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 relative">
            PulseStudy
            <div className="absolute inset-0 blur-xl opacity-30 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />
          </h1>
        </motion.div>

        {/* XP Achievement Banner */}
        <AnimatePresence>
          {showXPBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="mb-6 px-5 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">+10 Focus XP</p>
                <p className="text-xs text-slate-600">You showed up</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personalized Welcome */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl font-semibold text-slate-800 mb-8"
        >
          Ready to level up, {userName}?
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Button 
            onClick={onGetStarted}
            className="h-16 px-10 rounded-[20px] text-lg font-bold bg-white/70 backdrop-blur-xl border border-white/60 text-slate-900 hover:bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Start Your Focus Quest</span>
            <ChevronRight className="w-5 h-5 ml-2 relative" />
          </Button>
        </motion.div>

        {/* Rotating Quote Module */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-6 w-full max-w-md"
        >
          <div className="relative h-16 flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentQuote}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-sm md:text-base text-slate-600 font-medium italic"
              >
                "{MOTIVATIONAL_QUOTES[currentQuote]}"
              </motion.p>
            </AnimatePresence>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full max-w-xs mb-6"
        >
          <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent animate-pulse" />
            </motion.div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">{progress}% — Your journey begins</p>
        </motion.div>

        {/* Learn More Link */}
        <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
          <DialogTrigger asChild>
            <button className="text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
              Learn More
            </button>
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