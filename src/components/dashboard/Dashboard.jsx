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
  Shield,
  Settings,
  X
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from '../schedule/NotificationSettings';
import RandomEventBanner from '../rewards/RandomEventBanner';
import MysteryBoxUnbox from '../rewards/MysteryBoxUnbox';
import StreakDisplay from '../rewards/StreakDisplay';

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors">
    <div className={`absolute top-0 right-0 p-2 md:p-4 opacity-20 group-hover:opacity-40 transition-opacity text-${color}-400`}>
      <Icon className="w-10 h-10 md:w-16 md:h-16 transform rotate-12 translate-x-2 md:translate-x-4 translate-y-[-5px] md:translate-y-[-10px]" />
    </div>
    <div className="relative z-10">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-${color}-500/20 flex items-center justify-center mb-2 md:mb-3 text-${color}-400`}>
        <Icon className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <p className="text-white/40 text-xs md:text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl md:text-3xl font-bold mt-0.5 md:mt-1 tracking-tight text-white">{value}</h3>
      {trend && <p className="text-green-400 text-[10px] md:text-xs mt-1 md:mt-2 font-mono">{trend}</p>}
    </div>
  </div>
);

const FocusTimer = ({ accentColor, userProfile, updateProfileMutation, createSessionMutation }) => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [motivationIndex, setMotivationIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle, focus, break, summary
  const [mode, setMode] = useState('standard'); // standard, custom, deepFocus
  const [pauseCount, setPauseCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  const MODES = {
    standard: { focus: 25, break: 5, name: 'Standard' },
    custom: { focus: 45, break: 10, name: 'Custom' },
    deepFocus: { focus: 90, break: 15, name: 'Deep Focus' }
  };

  const AMBIENT_SOUNDS = [
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'cafe', name: 'Café', emoji: '☕' },
    { id: 'whitenoise', name: 'White Noise', emoji: '📻' },
    { id: 'synth', name: 'Synth Wave', emoji: '🎵' },
    { id: 'none', name: 'Silence', emoji: '🔇' }
  ];

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
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleSessionComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!isActive) return;
    const messageInterval = setInterval(() => {
      setMotivationIndex(prev => (prev + 1) % motivationalMessages.length);
    }, 120000);
    return () => clearInterval(messageInterval);
  }, [isActive]);

  const handleSessionComplete = () => {
    setIsActive(false);
    const duration = MODES[mode].focus;
    const isPerfect = pauseCount === 0;
    const basePoints = duration * 2;
    const multiplier = completedSessions > 0 ? 1 + (completedSessions * 0.1) : 1;
    const perfectBonus = isPerfect ? 50 : 0;
    const pointsEarned = Math.round(basePoints * multiplier) + perfectBonus;

    createSessionMutation.mutate({
      durationMinutes: duration,
      status: 'completed',
      pointsEarned,
      focusProfile: mode
    });

    // Check if we should increment streak (only once per day)
    const today = moment().format('YYYY-MM-DD');
    const lastStreakDate = userProfile?.lastStreakDate 
      ? moment(userProfile.lastStreakDate).format('YYYY-MM-DD') 
      : null;

    const shouldIncrementStreak = lastStreakDate !== today;
    const newStreak = shouldIncrementStreak 
      ? (userProfile?.currentStreak || 0) + 1 
      : (userProfile?.currentStreak || 0);

    updateProfileMutation.mutate({
      totalPoints: (userProfile?.totalPoints || 0) + pointsEarned,
      currentStreak: newStreak,
      lastStreakDate: shouldIncrementStreak ? today : userProfile?.lastStreakDate
    });

    setSessionData({
      duration,
      pointsEarned,
      pauseCount,
      isPerfect,
      streak: newStreak,
      streakIncremented: shouldIncrementStreak
    });

    setCompletedSessions(prev => prev + 1);
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } }), 300);
    setPhase('summary');
  };

  const startBreak = () => {
    setPhase('break');
    setTimeLeft(MODES[mode].break * 60);
    setIsActive(true);
    setPauseCount(0);
  };

  const skipBreak = () => {
    setPhase('idle');
    setTimeLeft(MODES[mode].focus * 60);
    setSessionData(null);
  };

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsFullScreen(true);
      setPhase('focus');
      setSessionStartTime(Date.now());
    } else {
      setIsActive(false);
      setPauseCount(prev => prev + 1);
    }
  };

  const exitFullScreen = () => {
    setIsFullScreen(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = ((MODES[mode].focus * 60 - timeLeft) / (MODES[mode].focus * 60)) * 100;
  
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

  // Show summary modal
  if (phase === 'summary' && sessionData) {
    return (
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2">Session Complete! 🎉</h3>
          <div className="space-y-3 mb-6">
            <p className="text-4xl font-black text-white">{sessionData.pointsEarned} XP</p>
            <p className="text-white/60">{sessionData.duration} minutes focused</p>
            {sessionData.isPerfect && <p className="text-yellow-400 font-bold">⭐ Perfect Session!</p>}
          </div>
          <div className="flex gap-3">
            <Button onClick={startBreak} className={`bg-${c}-500 hover:bg-${c}-600`}>
              Take Break
            </Button>
            <Button onClick={skipBreak} variant="outline" className="border-white/20">
              Skip Break
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show break timer
  if (phase === 'break') {
    return (
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2">Break Time 🌿</h3>
          <div className="relative w-40 h-40 flex items-center justify-center my-6">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <circle 
                cx="80" cy="80" r="70" 
                stroke="currentColor" strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - ((MODES[mode].break * 60 - timeLeft) / (MODES[mode].break * 60)))}
                className={`text-${c}-400 transition-all duration-1000 ease-linear`}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-4xl font-black tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsActive(!isActive)} variant="outline" className="border-white/20">
              {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isActive ? 'Pause' : 'Resume'}
            </Button>
            <Button onClick={skipBreak} variant="outline" className="border-white/20">
              Skip Break
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Widget View
  return (
    <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[220px] md:min-h-[300px]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      
      {showSettings && (
        <div className="absolute inset-0 z-20 glass-card rounded-2xl md:rounded-3xl p-3 md:p-4 overflow-auto">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h4 className="font-bold text-white text-sm md:text-base">Settings</h4>
            <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div>
              <p className="text-white/60 text-[10px] md:text-xs mb-1.5 md:mb-2">Mode</p>
              <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                {Object.entries(MODES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMode(key);
                      setTimeLeft(config.focus * 60);
                      setPhase('idle');
                    }}
                    className={`p-1.5 md:p-2 rounded-lg text-[10px] md:text-xs ${mode === key ? `bg-${c}-500` : 'bg-white/5'}`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/60 text-[10px] md:text-xs mb-1.5 md:mb-2">Ambient Sound</p>
              <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                {AMBIENT_SOUNDS.map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => setAmbientSound(sound.id)}
                    className={`p-1.5 md:p-2 rounded-lg text-xs md:text-sm ${ambientSound === sound.id ? `bg-${c}-500` : 'bg-white/5'}`}
                  >
                    {sound.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 mb-3 md:mb-4 flex items-center justify-between w-full">
        <div>
          <h3 className="text-white/60 font-medium text-sm md:text-base">Pomodoro Timer</h3>
          <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest mt-0.5 md:mt-1">{MODES[mode].name} Mode</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="text-white/60 hover:text-white">
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-4 md:mb-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => isActive && setIsFullScreen(true)}>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5 md:hidden" />
          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)} className={`text-${c}-400 transition-all duration-1000 ease-linear md:hidden`} strokeLinecap="round" />
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5 hidden md:block" />
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)} className={`text-${c}-400 transition-all duration-1000 ease-linear hidden md:block`} strokeLinecap="round" />
        </svg>
        <div className="text-3xl md:text-4xl font-black tabular-nums tracking-tighter">
          {formatTime(timeLeft)}
        </div>
        {isActive && <div className="absolute bottom-6 md:bottom-10 text-[9px] md:text-[10px] text-white/40 font-bold uppercase">Tap to Expand</div>}
      </div>

      <div className="flex gap-3 md:gap-4 relative z-10">
        <Button 
          size="lg"
          onClick={toggleTimer}
          className={`rounded-xl md:rounded-2xl h-10 md:h-12 px-6 md:px-8 font-bold text-sm md:text-base shadow-lg shadow-${c}-500/20 bg-white text-black hover:bg-white/90`}
        >
          {isActive ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
          {isActive ? 'Pause' : 'Start Focus'}
        </Button>
      </div>
    </div>
  );
};

const LoginRewardModal = ({ isOpen, onClose, reward }) => {
  if (!reward) return null;

  const rewardConfig = {
    xp_boost: {
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      icon: Zap,
      title: 'Lucky Login!',
      message: `${reward.amount}x XP Boost for ${reward.duration} minutes!`
    },
    focus_points: {
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
      icon: Zap,
      title: 'Surprise Reward!',
      message: `You earned ${reward.amount} Focus Points!`
    },
    streak_freeze: {
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      icon: Flame,
      title: 'Nice Timing!',
      message: `${reward.amount} Streak Freeze${reward.amount > 1 ? 's' : ''} added to your inventory!`
    },
    currency: {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      icon: Gift,
      title: 'Jackpot!',
      message: `You got ${reward.amount} coins!`
    },
    pomodoro_boost: {
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      icon: Trophy,
      title: 'Power Up!',
      message: `Next Pomodoro session gives ${reward.amount}x points!`
    }
  };

  const config = rewardConfig[reward.type] || rewardConfig.focus_points;
  const Icon = config.icon;

  return (
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
            <div className={`bg-gradient-to-br ${config.gradient} p-8 rounded-[1.8rem]`}>
              <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{config.title}</h2>
              <p className="text-white/80 mb-6">{config.message}</p>
              <Button onClick={onClose} className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl h-12">
                Claim Reward! 🎉
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN DASHBOARD ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [loginReward, setLoginReward] = useState(null);
  const [mysteryBoxToOpen, setMysteryBoxToOpen] = useState(null);
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

  // Calculate Quiz Mastery
  const { data: quizMastery } = useQuery({
    queryKey: ['quizMastery'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const interactions = await base44.entities.UserInteraction.filter({
        created_by: user.email,
        interactionType: 'completed'
      });

      if (interactions.length === 0) return 0;

      // Calculate average accuracy
      const totalAccuracy = interactions.reduce((sum, interaction) => {
        return sum + (interaction.accuracy || 0);
      }, 0);

      return Math.round((totalAccuracy / interactions.length) * 100);
    },
    initialData: 0
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

  // Get today's schedule blocks
  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['todaySchedule'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, 6 = Sunday

      const blocks = await base44.entities.ScheduleBlock.filter({
        created_by: user.email,
        day: dayIndex
      });

      return blocks.sort((a, b) => a.start - b.start);
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      return await base44.entities.FocusSession.create(sessionData);
    },
  });

  // Query mystery boxes
  const { data: mysteryBoxes = [] } = useQuery({
    queryKey: ['mysteryBoxes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.MysteryBox.filter({ 
        created_by: user.email,
        isOpened: false
      });
    },
  });

  // Handle Randomized Login Rewards
  useEffect(() => {
    if (!userProfile) return;

    const now = moment();
    const lastRewardTime = userProfile.lastDopamineDropDate 
      ? moment(userProfile.lastDopamineDropDate) 
      : null;

    // Check if 24 hours have passed since last reward
    if (lastRewardTime && now.diff(lastRewardTime, 'hours') < 24) {
      return; // Cooldown active
    }

    // Calculate base probability (25%)
    let rewardProbability = 0.25;

    // Bonus for streak users (up to +10%)
    if (userProfile.currentStreak >= 7) {
      rewardProbability += 0.10;
    } else if (userProfile.currentStreak >= 3) {
      rewardProbability += 0.05;
    }

    // Bonus for returning users (up to +15%)
    if (lastRewardTime) {
      const daysSinceLastReward = now.diff(lastRewardTime, 'days');
      if (daysSinceLastReward >= 7) {
        rewardProbability += 0.15;
      } else if (daysSinceLastReward >= 3) {
        rewardProbability += 0.10;
      }
    }

    // Random roll
    const roll = Math.random();
    if (roll > rewardProbability) {
      return; // No reward this time
    }

    // Generate random reward
    const rewardTypes = [
      { type: 'xp_boost', amount: 2, duration: 60 },
      { type: 'xp_boost', amount: 3, duration: 30 },
      { type: 'focus_points', amount: 100 + Math.floor(Math.random() * 200) },
      { type: 'focus_points', amount: 250 + Math.floor(Math.random() * 250) },
      { type: 'streak_freeze', amount: 1 },
      { type: 'currency', amount: 50 + Math.floor(Math.random() * 150) },
      { type: 'pomodoro_boost', amount: 2 }
    ];

    const randomReward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

    // Award the reward
    const timer = setTimeout(() => {
      setLoginReward(randomReward);

      // Apply reward
      const updates = { lastDopamineDropDate: now.toISOString() };
      if (randomReward.type === 'focus_points') {
        updates.totalPoints = (userProfile.totalPoints || 0) + randomReward.amount;
      } else if (randomReward.type === 'currency') {
        updates.currency = (userProfile.currency || 0) + randomReward.amount;
      }

      updateProfileMutation.mutate(updates);
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 } });
    }, 1500);

    return () => clearTimeout(timer);
  }, [userProfile?.id]);

  // Auto-open mystery box if available
  useEffect(() => {
    if (mysteryBoxes.length > 0 && !mysteryBoxToOpen) {
      const timer = setTimeout(() => {
        setMysteryBoxToOpen(mysteryBoxes[0]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mysteryBoxes, mysteryBoxToOpen]);

  const accentColor = userProfile?.accentColor || 'neonGreen';

    // Color mapping for dynamic classes
    const colorMap = {
      neonGreen: 'green',
      coral: 'rose',
      electricBlue: 'cyan'
    };
    const themeColor = colorMap[accentColor] || 'green';

    // Dynamic greeting based on time of day
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    };

  return (
    <div className="bg-slate-950 text-white p-3 md:p-8 relative overflow-x-hidden">
      <RandomEventBanner />
      
      {mysteryBoxToOpen && (
        <MysteryBoxUnbox 
          box={mysteryBoxToOpen}
          onClose={() => {
            setMysteryBoxToOpen(null);
            queryClient.invalidateQueries(['mysteryBoxes']);
          }}
        />
      )}
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-${themeColor}-600/10 blur-[120px]`} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-4 md:space-y-8">
        
        {/* Title and Subheading */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{getGreeting()}, {currentUser?.full_name?.split(' ')[0] || 'Friend'}</h1>
          <p className="text-white/60 text-sm md:text-base">Ready to crush your {userProfile?.weeklyGoalHours || 10}h goal this week?</p>
        </div>

        {/* User Info Bar */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <StreakDisplay currentStreak={userProfile?.currentStreak || 0} />
          <NotificationSettings />
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-xs md:text-sm font-bold">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* Pomodoro CTA Banner */}
          <div className="md:col-span-8">
            <button
              onClick={() => navigate(createPageUrl('PomodoroTimer'))}
              className="w-full glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 hover:shadow-2xl hover:shadow-purple-500/30 transition-all group relative overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4 md:gap-6">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50 flex-shrink-0">
                  <Zap className="w-7 h-7 md:w-10 md:h-10 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1">Pomodoro Focus Timer</h3>
                  <p className="text-white/60 text-xs md:text-base">Enter deep work mode with gamified focus sessions</p>
                </div>
                <div className="text-purple-400 text-2xl md:text-3xl group-hover:translate-x-2 transition-transform flex-shrink-0">→</div>
              </div>
            </button>
          </div>

          {/* AI Study Assistant */}
          <div className="md:col-span-2 h-full">
            <button
              onClick={() => navigate(createPageUrl('StudyAssistant'))}
              className="w-full glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 hover:shadow-2xl transition-all group h-full"
              style={{ boxShadow: `0 0 60px -15px ${themeColor === 'green' ? '#4ade80' : themeColor === 'rose' ? '#fb7185' : '#06b6d4'}33` }}
            >
              <div className="flex flex-col items-center justify-center gap-3 md:gap-4 h-full">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-${themeColor}-600 to-${themeColor === 'green' ? 'emerald' : themeColor === 'rose' ? 'pink' : 'blue'}-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-base md:text-xl font-bold text-white mb-1">Study Assistant</h3>
                  <p className="text-white/60 text-xs">Get instant help</p>
                </div>
              </div>
            </button>
          </div>

          {/* Sprint Mode */}
          <div className="md:col-span-2 h-full">
            <button
              onClick={() => navigate(createPageUrl('SprintMode'))}
              className="w-full glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all group h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center justify-center gap-3 md:gap-4 h-full">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-base md:text-xl font-bold text-white mb-1">Sprint Mode ⚡</h3>
                  <p className="text-white/60 text-xs">2-10 min speed rounds</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-6">
            <StatCard 
              title="Focus Points" 
              value={userProfile?.totalPoints || 0} 
              icon={Zap} 
              color="yellow" 
              trend="Keep grinding!"
            />
          </div>
          <div className="md:col-span-6">
            <StatCard 
              title="Quiz Mastery" 
              value={`${quizMastery}%`} 
              icon={Brain} 
              color="purple" 
              trend={quizMastery > 0 ? (quizMastery >= 80 ? "Excellent!" : quizMastery >= 60 ? "Good progress!" : "Keep practicing!") : "Start a quiz!"}
            />
          </div>

          {/* Weekly Goal Progress - Full width */}
          <div className="md:col-span-12 glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl">
            <div className="flex justify-between items-end mb-3 md:mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold">Weekly Goal</h3>
                <p className="text-xs md:text-sm text-white/40">{userProfile?.weeklyGoalHours || 10} hours targeted</p>
              </div>
              <div className="text-right">
                <span className="text-2xl md:text-3xl font-bold text-white">0</span>
                <span className="text-white/40 text-xs md:text-sm"> / {userProfile?.weeklyGoalHours || 10}h</span>
              </div>
            </div>
            <div className="h-3 md:h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '0%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-300 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.5)]`}
              />
            </div>
          </div>

          {/* Today's Schedule - Full width */}
          <div className="md:col-span-12 glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl">
            <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Today's Schedule</h3>
            {todaySchedule.length > 0 ? (
              <div className="space-y-2">
                {todaySchedule.map((block) => {
                  const formatTime = (decimalTime) => {
                    const hours = Math.floor(decimalTime);
                    const minutes = Math.round((decimalTime - hours) * 60);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                  };

                  return (
                    <div 
                      key={block.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <div 
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: block.color }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white">{block.title}</div>
                        <div className="text-xs text-white/60">
                          {formatTime(block.start)} - {formatTime(block.end)}
                        </div>
                      </div>
                      <div className="text-xs text-white/40 capitalize">{block.type}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 md:h-32 text-white/40 text-sm md:text-base">
                <p>No schedule blocks for today</p>
              </div>
            )}
          </div>
          </div>

      </div>

      <LoginRewardModal 
        isOpen={!!loginReward} 
        onClose={() => setLoginReward(null)} 
        reward={loginReward}
      />
    </div>
  );
}