import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Target, 
  Clock, 
  Brain, 
  Trophy, 
  MoreHorizontal, 
  Play, 
  Pause,
  RotateCcw,
  Gift,
  Flame,
  Calendar as CalendarIcon,
  MessageSquare,
  Shield
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="glass-card p-5 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors">
    <div className={`absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity text-${color}-400`}>
      <Icon className="w-16 h-16 transform rotate-12 translate-x-4 translate-y-[-10px]" />
    </div>
    <div className="relative z-10">
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3 text-${color}-400`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-white/40 text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold mt-1 tracking-tight text-white">{value}</h3>
      {trend && <p className="text-green-400 text-xs mt-2 font-mono">{trend}</p>}
    </div>
  </div>
);

const FocusTimer = ({ accentColor }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [motivationIndex, setMotivationIndex] = useState(0);

  const motivationalMessages = [
    "You're in the zone! Keep crushing it! 🔥",
    "Deep work = Deep results 💪",
    "Your future self will thank you 🌟",
    "Focus now, flex later 💯",
    "Champions are made in moments like these 🏆",
    "You're unstoppable right now! ⚡",
    "This is where magic happens ✨",
    "Keep going! You're doing amazing! 🚀"
  ];

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsFullScreen(false);
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } }), 200);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Rotate motivational messages every 2 minutes
  useEffect(() => {
    if (!isActive) return;
    const messageInterval = setInterval(() => {
      setMotivationIndex(prev => (prev + 1) % motivationalMessages.length);
    }, 120000); // 2 minutes
    return () => clearInterval(messageInterval);
  }, [isActive]);

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsFullScreen(true);
    } else {
      setIsActive(false);
    }
  };

  const exitFullScreen = () => {
    setIsFullScreen(false);
    // Don't stop timer, just minimize
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  
  // Dynamic color helper
  const getColor = () => {
    if (accentColor === 'coral') return 'rose';
    if (accentColor === 'electricBlue') return 'cyan';
    return 'green';
  };
  const c = getColor();

  // Full Screen Overlay
  if (isFullScreen) {
    const progressPercent = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
    const milestone = progressPercent > 80 ? "Almost there! Final push! 🎯" 
                    : progressPercent > 60 ? "You're crushing it! Keep going! 💪"
                    : progressPercent > 40 ? "Halfway there! Stay strong! 🔥"
                    : progressPercent > 20 ? "Great start! Momentum building! ⚡"
                    : "Let's do this! 🚀";

    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-md"
        >
           <div className="mb-8">
             <motion.div 
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
               className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${c}-500/10 text-${c}-400 mb-6 border border-${c}-500/20`}
             >
               <Shield className="w-4 h-4" />
               <span className="font-bold tracking-wider text-sm">FOCUS SHIELD ACTIVE</span>
             </motion.div>
             <h2 className="text-4xl font-bold text-white mb-2">Stay in the zone.</h2>
             <p className="text-white/40 mb-4">Distractions are locked out. You got this! 🔒</p>
             
             {/* Motivational Message */}
             <motion.div
               key={motivationIndex}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="text-lg font-semibold text-white/80 mb-2"
             >
               {motivationalMessages[motivationIndex]}
             </motion.div>
             
             {/* Milestone Message */}
             <motion.p
               key={milestone}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className={`text-${c}-400 font-bold`}
             >
               {milestone}
             </motion.p>
           </div>

           {/* Large Timer */}
           <div className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full border-4 border-${c}-500/10`} 
              />
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                <circle 
                  cx="160" cy="160" r="140" 
                  stroke="currentColor" strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 140}
                  strokeDashoffset={2 * Math.PI * 140 * (1 - progressPercent / 100)}
                  className={`text-${c}-400 transition-all duration-1000 ease-linear drop-shadow-[0_0_20px_currentColor]`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center">
                <div className="text-7xl font-black tabular-nums tracking-tighter text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-white/40 mt-2 font-mono">
                  {Math.round(progressPercent)}% Complete
                </div>
              </div>
           </div>
           
           {/* Focus Tips Reminder */}
           <div className="glass-card rounded-2xl p-4 mb-8 max-w-sm mx-auto">
             <p className="text-xs text-white/60 leading-relaxed">
               💡 <span className="font-semibold">Pro tip:</span> If you need a break, check social media AFTER this session. You're building willpower! 💪
             </p>
           </div>

           <div className="flex flex-col gap-4">
             <Button 
               onClick={exitFullScreen}
               variant="outline"
               className="h-14 rounded-2xl border-white/10 text-white hover:bg-white/5"
             >
               Minimize (Keep Running)
             </Button>
             <Button 
               onClick={() => { 
                 if (window.confirm("Are you sure? Giving up will break your focus streak and you won't earn points for this session!")) {
                   setIsActive(false); 
                   setIsFullScreen(false); 
                 }
               }}
               className="h-14 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
             >
               ⚠️ Give Up (Lose Points)
             </Button>
           </div>
        </motion.div>
      </div>
    );
  }

  // Widget View
  return (
    <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[300px]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      
      <div className="relative z-10 mb-6">
        <h3 className="text-white/60 font-medium">Focus Shield</h3>
        <p className="text-xs text-white/30 uppercase tracking-widest mt-1">Ready to block distractions?</p>
      </div>

      <div className="relative w-40 h-40 flex items-center justify-center mb-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => isActive && setIsFullScreen(true)}>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
          <circle 
            cx="80" cy="80" r="70" 
            stroke="currentColor" strokeWidth="8" 
            fill="transparent" 
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)}
            className={`text-${c}-400 transition-all duration-1000 ease-linear`}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-4xl font-black tabular-nums tracking-tighter">
          {formatTime(timeLeft)}
        </div>
        {isActive && <div className="absolute bottom-10 text-[10px] text-white/40 font-bold uppercase">Tap to Expand</div>}
      </div>

      <div className="flex gap-4 relative z-10">
        <Button 
          size="lg"
          onClick={toggleTimer}
          className={`rounded-2xl h-12 px-8 font-bold shadow-lg shadow-${c}-500/20 bg-white text-black hover:bg-white/90`}
        >
          {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isActive ? 'Pause' : 'Start Focus'}
        </Button>
      </div>
    </div>
  );
};

const DopamineDropModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 50 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className="relative w-full max-w-sm glass-card p-1 text-center rounded-[2rem] overflow-hidden"
        >
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 rounded-[1.8rem]">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Daily Drop!</h2>
            <p className="text-white/80 mb-6">You unlocked a <span className="font-bold text-yellow-300">2x XP Boost</span> for the next hour!</p>
            <Button onClick={onClose} className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl h-12">
              Claim Reward
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- MAIN DASHBOARD ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [showDrop, setShowDrop] = useState(false);
  const queryClient = useQueryClient();

  // Get Auth User for Name
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  
  // Get Profile Data
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
       const profiles = await base44.entities.UserProfile.list();
       // Return existing profile or defaults
       return profiles[0] || { 
         accentColor: 'neonGreen', 
         weeklyGoalHours: 10, 
         totalPoints: 0, 
         currentStreak: 0,
         lastDopamineDropDate: null 
       };
    },
  });

  // Mutation to update drop date
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 0) {
        return await base44.entities.UserProfile.update(profiles[0].id, updatedData);
      } else {
        return await base44.entities.UserProfile.create(updatedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  // Handle Daily Dopamine Drop Logic
  useEffect(() => {
    if (!userProfile) return;

    const today = moment().format('YYYY-MM-DD');
    const lastDropDate = userProfile.lastDopamineDropDate 
      ? moment(userProfile.lastDopamineDropDate).format('YYYY-MM-DD') 
      : null;

    // Only show if we haven't shown it today
    if (lastDropDate !== today) {
      const timer = setTimeout(() => {
        setShowDrop(true);
        // Mark as shown for today
        updateProfileMutation.mutate({ lastDopamineDropDate: today });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userProfile?.id]); // Only run when profile loads/changes

  const accentColor = userProfile?.accentColor || 'neonGreen';
  
  // Color mapping for dynamic classes
  const colorMap = {
    neonGreen: 'green',
    coral: 'rose',
    electricBlue: 'cyan'
  };
  const themeColor = colorMap[accentColor] || 'green';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-${themeColor}-600/10 blur-[120px]`} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Enhanced Pomodoro CTA */}
        <button
          onClick={() => navigate(createPageUrl('PomodoroTimer'))}
          className="w-full glass-card rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/30 transition-all group relative overflow-hidden mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-2xl font-bold text-white mb-1">Pomodoro Focus Timer</h3>
              <p className="text-white/60">Enter deep work mode with gamified focus sessions</p>
            </div>
            <div className="text-purple-400 text-3xl group-hover:translate-x-2 transition-transform">→</div>
          </div>
        </button>

        {/* AI Study Assistant Button */}
        <button
          onClick={() => navigate(createPageUrl('StudyAssistant'))}
          className="w-full glass-card rounded-2xl p-6 hover:shadow-2xl transition-all group"
          style={{ boxShadow: `0 0 60px -15px ${themeColor === 'green' ? '#4ade80' : themeColor === 'rose' ? '#fb7185' : '#06b6d4'}33` }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-${themeColor}-600 to-${themeColor === 'green' ? 'emerald' : themeColor === 'rose' ? 'pink' : 'blue'}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Ask the Study Assistant</h3>
              <p className="text-white/60 text-sm">Get step-by-step help on any topic</p>
            </div>
            <div className={`text-${themeColor}-400 group-hover:translate-x-1 transition-transform`}>→</div>
          </div>
        </button>
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Good afternoon, {currentUser?.full_name?.split(' ')[0] || 'Friend'}</h1>
            <p className="text-white/40">Ready to crush your {userProfile?.weeklyGoalHours || 10}h goal this week?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="font-bold">{userProfile?.currentStreak || 0} Day Streak</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Goals */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
             <StatCard 
               title="Focus Points" 
               value={userProfile?.totalPoints || 0} 
               icon={Zap} 
               color="yellow" 
               trend="Keep grinding!"
             />
             <StatCard 
               title="Quiz Mastery" 
               value="0%" 
               icon={Brain} 
               color="purple" 
               trend="Start a quiz!"
             />
             
             {/* Weekly Goal Progress - Spans 2 cols */}
             <div className="col-span-1 sm:col-span-2 glass-card p-6 rounded-3xl">
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <h3 className="text-lg font-bold">Weekly Goal</h3>
                   <p className="text-sm text-white/40">{userProfile?.weeklyGoalHours || 10} hours targeted</p>
                 </div>
                 <div className="text-right">
                   <span className="text-3xl font-bold text-white">0</span>
                   <span className="text-white/40 text-sm"> / {userProfile?.weeklyGoalHours || 10}h</span>
                 </div>
               </div>
               <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '0%' }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={`h-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-300 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.5)]`}
                 />
               </div>
             </div>

             {/* Recent Activity */}
             <div className="col-span-1 sm:col-span-2 glass-card p-6 rounded-3xl">
                <h3 className="text-lg font-bold mb-4">Today's Schedule</h3>
                <div className="flex items-center justify-center h-32 text-white/40">
                  <p>Build your schedule in the Schedule tab</p>
                </div>
             </div>
          </div>

          {/* Right Column: Focus Timer */}
          <div className="md:col-span-4 h-full">
            <FocusTimer accentColor={accentColor} />
          </div>

        </div>

      </div>

      <DopamineDropModal isOpen={showDrop} onClose={() => setShowDrop(false)} />
    </div>
  );
}