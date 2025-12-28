import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, Shield, Brain, Sparkles, X, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [showXPBanner, setShowXPBanner] = useState(false);
  const [userName, setUserName] = useState('');
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { totalPoints: 0 };
    },
  });

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = await base44.auth.me();
        const name = user.full_name ? user.full_name.split(' ')[0] : 'there';
        setUserName(name);
      } catch (error) {
        setUserName('there');
      }
    };
    fetchUserName();
  }, []);

  // Award 10 XP mutation
  const awardXPMutation = useMutation({
    mutationFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles[0]) {
        return await base44.entities.UserProfile.update(profiles[0].id, {
          totalPoints: (userProfile?.totalPoints || 0) + 10
        });
      } else {
        return await base44.entities.UserProfile.create({
          totalPoints: 10
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  // Show XP banner on mount and award XP
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowXPBanner(true);
      awardXPMutation.mutate();
      setTimeout(() => setShowXPBanner(false), 3000);
    }, 800);
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-cyan-400 selection:text-slate-900">
      
      {/* Enhanced Vibrant Background with Neon Accents */}
      <div className="absolute inset-0 z-0">
        {/* Primary neon glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/40 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/40 blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-pink-500/30 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[35%] rounded-full bg-green-400/25 blur-[90px] animate-float" style={{ animationDelay: '-3s' }} />
        
        {/* Subtle grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* XP Achievement Banner */}
      <AnimatePresence>
        {showXPBanner && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="glass-card px-6 py-4 rounded-2xl border-2 border-green-400/50 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-green-400 font-bold text-lg">+10 Focus XP</div>
                  <div className="text-white/70 text-sm">You showed up</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* Logo/Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 px-4"
        >
          <motion.div 
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(6, 182, 212, 0.5)',
                '0 0 40px rgba(168, 85, 247, 0.6)',
                '0 0 20px rgba(6, 182, 212, 0.5)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-white/20 backdrop-blur-xl"
          >
            <Zap className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" strokeWidth={2.5} />
          </motion.div>
          <motion.h1 
            animate={{ 
              textShadow: [
                '0 0 20px rgba(6, 182, 212, 0.5)',
                '0 0 30px rgba(168, 85, 247, 0.6)',
                '0 0 20px rgba(6, 182, 212, 0.5)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl md:text-7xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 pb-2"
            style={{ lineHeight: '1.2' }}
          >
            PulseStudy
          </motion.h1>
          <p className="text-lg md:text-xl font-semibold text-white/90 tracking-wide mb-2">
            Focus smarter. Study stronger.
          </p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base text-cyan-300/80 font-medium"
          >
            Ready to level up, {userName}?
          </motion.p>
        </motion.div>

        {/* Rotating Sublines */}
        <div className="h-16 mb-12 flex items-center justify-center w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLine + sublineType}
              initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
              className="text-lg md:text-xl font-medium text-cyan-300/90 flex items-center gap-2"
            >
              {sublineType === 'gamified' && <Sparkles className="w-4 h-4" />}
              {activeLines[currentLine]}
              {sublineType === 'gamified' && <Sparkles className="w-4 h-4" />}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button 
              onClick={onGetStarted}
              className="h-16 w-full rounded-2xl text-lg font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] border-2 border-white/20 transition-all backdrop-blur-sm"
            >
              <span className="drop-shadow-lg">Start Your Focus Quest</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-12 rounded-2xl text-white/60 hover:text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none overflow-hidden text-white">
              <LearnMoreCarousel onClose={() => setShowLearnMore(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Mode Toggle */}
        <button 
          onClick={() => setSublineType(prev => prev === 'motivational' ? 'gamified' : 'motivational')}
          className="mt-8 text-xs text-white/40 hover:text-white/70 transition-colors px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
        >
          Switch Vibe: {sublineType}
        </button>

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