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
  Calendar as CalendarIcon
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

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
  const [sessionType, setSessionType] = useState('pomodoro'); // pomodoro, shortBreak, longBreak

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      
      <div className="relative z-10 mb-6">
        <h3 className="text-white/60 font-medium">Focus Shield</h3>
        <p className="text-xs text-white/30 uppercase tracking-widest mt-1">Ready to block distractions?</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        {/* Ring Background */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
          <circle 
            cx="96" cy="96" r="88" 
            stroke="currentColor" strokeWidth="8" 
            fill="transparent" 
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            className={`text-${accentColor === 'neonGreen' ? 'green' : accentColor === 'coral' ? 'rose' : 'cyan'}-400 transition-all duration-1000 ease-linear`}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-5xl font-black tabular-nums tracking-tighter">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        <Button 
          size="lg"
          onClick={toggleTimer}
          className={`rounded-2xl h-14 px-8 text-lg font-bold shadow-lg shadow-${accentColor === 'neonGreen' ? 'green' : 'rose'}-500/20 bg-white text-black hover:bg-white/90`}
        >
          {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
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
  const [showDrop, setShowDrop] = useState(false);
  
  // Mock User Data (Replace with real query later)
  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
       const profiles = await base44.entities.UserProfile.list();
       return profiles[0] || { accentColor: 'neonGreen', weeklyGoalHours: 10 };
    },
    initialData: { accentColor: 'neonGreen', weeklyGoalHours: 10 }
  });

  // Simulate drop appearing
  useEffect(() => {
    const timer = setTimeout(() => setShowDrop(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const accentColor = user?.accentColor || 'neonGreen';
  
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
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Good afternoon, Alex</h1>
            <p className="text-white/40">Ready to crush your 2h goal today?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="font-bold">12 Day Streak</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10" />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Goals */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
             <StatCard 
               title="Focus Points" 
               value="2,450" 
               icon={Zap} 
               color="yellow" 
               trend="+150 today"
             />
             <StatCard 
               title="Quiz Mastery" 
               value="85%" 
               icon={Brain} 
               color="purple" 
               trend="Top 10% of class"
             />
             
             {/* Weekly Goal Progress - Spans 2 cols */}
             <div className="col-span-1 sm:col-span-2 glass-card p-6 rounded-3xl">
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <h3 className="text-lg font-bold">Weekly Goal</h3>
                   <p className="text-sm text-white/40">10 hours targeted</p>
                 </div>
                 <div className="text-right">
                   <span className="text-3xl font-bold text-white">6.5</span>
                   <span className="text-white/40 text-sm"> / 10h</span>
                 </div>
               </div>
               <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '65%' }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={`h-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-300 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.5)]`}
                 />
               </div>
             </div>

             {/* Recent Activity */}
             <div className="col-span-1 sm:col-span-2 glass-card p-6 rounded-3xl">
                <h3 className="text-lg font-bold mb-4">Today's Schedule</h3>
                <div className="space-y-4">
                  {[
                    { time: '14:00', label: 'Deep Work: Math', type: 'focus', duration: '45m' },
                    { time: '15:00', label: 'History Quiz', type: 'quiz', duration: '15m' },
                    { time: '16:00', label: 'Free Time', type: 'free', duration: '1h' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-16 text-sm text-white/40 font-mono">{item.time}</div>
                      <div className="flex-1 glass p-3 rounded-xl flex items-center justify-between border-l-4 border-l-cyan-400 hover:bg-white/5 transition-colors">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-md">{item.duration}</span>
                      </div>
                    </div>
                  ))}
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