import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  Shield, Zap, Coffee, X, Check, ArrowLeft, ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import SessionSummary from '@/components/pomodoro/SessionSummary';
import BreakTimer from '@/components/pomodoro/BreakTimer';
import { playSound, stopAmbient, playAmbient } from '@/components/utils/soundManager';

const MODES = {
  standard: { focus: 25, break: 5, name: 'Standard', icon: '⚡' },
  custom: { focus: 45, break: 10, name: 'Custom', icon: '⚙️' },
  deepFocus: { focus: 90, break: 15, name: 'Deep Focus', icon: '🔥' }
};

const FOCUS_QUOTES = [
  "Deep work creates deep results 💪",
  "Your future self will thank you 🌟",
  "Focus is your superpower ⚡",
  "Every second counts 🎯",
  "You're in the zone! 🔥",
  "Building something great takes time ✨",
  "Champions are made in moments like these 🏆",
  "This is where magic happens 🚀"
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', emoji: '🌧️' },
  { id: 'cafe', name: 'Café', emoji: '☕' },
  { id: 'whitenoise', name: 'White Noise', emoji: '📻' },
  { id: 'synth', name: 'Synth Wave', emoji: '🎵' },
  { id: 'none', name: 'Silence', emoji: '🔇' }
];

export default function PomodoroTimer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Session State
  const [mode, setMode] = useState('standard');
  const [phase, setPhase] = useState('idle'); // idle, focus, break, summary
  const [timeLeft, setTimeLeft] = useState(MODES.standard.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [pauseCount, setPauseCount] = useState(0);
  const [distractionAttempts, setDistractionAttempts] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [customFocus, setCustomFocus] = useState(45);
  const [customBreak, setCustomBreak] = useState(10);
  const [currentTheme, setCurrentTheme] = useState('dark-neon');
  const [sessionData, setSessionData] = useState(null);
  
  const timerRef = useRef(null);

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { totalPoints: 0, currentStreak: 0 };
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 0) {
        return await base44.entities.UserProfile.update(profiles[0].id, updates);
      } else {
        return await base44.entities.UserProfile.create(updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      return await base44.entities.FocusSession.create(sessionData);
    },
  });

  // Timer effect
  useEffect(() => {
    if (isActive && timeLeft > 0 && phase === 'focus') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleSessionComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft > 0 && phase === 'break') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleBreakComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, phase, timeLeft]);

  // Rotate quotes every 2 minutes
  useEffect(() => {
    if (phase === 'focus' && isActive) {
      const quoteInterval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % FOCUS_QUOTES.length);
      }, 120000);
      return () => clearInterval(quoteInterval);
    }
  }, [phase, isActive]);

  // Ambient sound management
  useEffect(() => {
    if (phase === 'focus' && isActive && ambientSound !== 'none') {
      playAmbient(ambientSound);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [phase, isActive, ambientSound]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('focus');
    setSessionStartTime(Date.now());
    if (soundEnabled) playSound('start');
  };

  const handlePause = () => {
    setIsActive(false);
    setPauseCount(prev => prev + 1);
    stopAmbient();
  };

  const handleResume = () => {
    setIsActive(true);
    if (soundEnabled) playSound('resume');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset? You will lose progress on this session.')) {
      setIsActive(false);
      setPhase('idle');
      setTimeLeft(MODES[mode].focus * 60);
      setPauseCount(0);
      setDistractionAttempts(0);
      stopAmbient();
    }
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    const duration = MODES[mode].focus;
    const isPerfect = pauseCount === 0 && distractionAttempts === 0;
    const basePoints = duration * 2;
    const multiplier = completedSessions > 0 ? 1 + (completedSessions * 0.1) : 1;
    const perfectBonus = isPerfect ? 50 : 0;
    const pointsEarned = Math.round(basePoints * multiplier) + perfectBonus;

    // Save session
    createSessionMutation.mutate({
      durationMinutes: duration,
      status: 'completed',
      pointsEarned,
      focusProfile: mode
    });

    // Update profile
    updateProfileMutation.mutate({
      totalPoints: (userProfile?.totalPoints || 0) + pointsEarned,
      currentStreak: (userProfile?.currentStreak || 0) + 1
    });

    setSessionData({
      duration,
      pointsEarned,
      pauseCount,
      distractionAttempts,
      isPerfect,
      streak: (userProfile?.currentStreak || 0) + 1
    });

    setCompletedSessions(prev => prev + 1);
    
    // Epic celebration
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } }), 300);
    
    if (soundEnabled) playSound('complete');
    stopAmbient();
    
    setPhase('summary');
  };

  const handleBreakComplete = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(MODES[mode].focus * 60);
    if (soundEnabled) playSound('complete');
  };

  const startBreak = () => {
    setPhase('break');
    setTimeLeft(MODES[mode].break * 60);
    setIsActive(true);
    setPauseCount(0);
    if (soundEnabled) playSound('break');
  };

  const skipBreak = () => {
    setPhase('idle');
    setTimeLeft(MODES[mode].focus * 60);
  };

  const changeMode = (newMode) => {
    if (newMode === 'custom') {
      setMode(newMode);
      setTimeLeft(customFocus * 60);
    } else {
      setMode(newMode);
      setTimeLeft(MODES[newMode].focus * 60);
    }
    setPhase('idle');
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getProgress = () => {
    const totalTime = phase === 'break' 
      ? MODES[mode].break * 60 
      : (mode === 'custom' ? customFocus * 60 : MODES[mode].focus * 60);
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getColorByProgress = () => {
    const progress = getProgress();
    if (progress < 30) return 'from-blue-500 to-cyan-500';
    if (progress < 60) return 'from-purple-500 to-pink-500';
    if (progress < 90) return 'from-orange-500 to-red-500';
    return 'from-yellow-400 to-orange-400';
  };

  const getMilestone = () => {
    const progress = getProgress();
    if (progress < 10) return "Let's do this! 🚀";
    if (progress < 25) return "Great start! Keep going! ⚡";
    if (progress < 50) return "You're crushing it! 💪";
    if (progress < 75) return "Halfway there! Stay strong! 🔥";
    if (progress < 90) return "Almost done! Final push! 🎯";
    return "You're a champion! Finish strong! 🏆";
  };

  // Show summary
  if (phase === 'summary') {
    return <SessionSummary data={sessionData} onContinue={startBreak} onFinish={skipBreak} />;
  }

  // Show break
  if (phase === 'break') {
    return (
      <BreakTimer 
        timeLeft={timeLeft}
        isActive={isActive}
        onPause={handlePause}
        onResume={handleResume}
        onSkip={handleBreakComplete}
        soundEnabled={soundEnabled}
      />
    );
  }

  // Main timer view
  const accentColor = userProfile?.accentColor || 'neonGreen';
  const themeColor = accentColor === 'coral' ? 'rose' : accentColor === 'electricBlue' ? 'cyan' : 'green';

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      currentTheme === 'dark-neon' ? 'bg-slate-950' :
      currentTheme === 'glass' ? 'bg-slate-900' :
      'bg-white'
    }`}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br ${getColorByProgress()} opacity-20 blur-[120px]`} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-3xl p-6 mb-6"
            >
              <h3 className="text-white font-bold text-lg mb-4">Session Settings</h3>
              
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {Object.entries(MODES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => changeMode(key)}
                    disabled={phase !== 'idle'}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      mode === key 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    } ${phase !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-2xl mb-2">{config.icon}</div>
                    <div className="text-white font-semibold text-sm">{config.name}</div>
                    <div className="text-white/60 text-xs mt-1">{config.focus}m / {config.break}m</div>
                  </button>
                ))}
              </div>

              {/* Ambient Sound */}
              <div className="mb-4">
                <label className="text-white/60 text-sm mb-2 block">Ambient Sound</label>
                <div className="grid grid-cols-5 gap-2">
                  {AMBIENT_SOUNDS.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => setAmbientSound(sound.id)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        ambientSound === sound.id
                          ? 'bg-purple-500/20 border-2 border-purple-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-1">{sound.emoji}</div>
                      <div className="text-white text-xs">{sound.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Status Badge */}
          {phase === 'focus' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getColorByProgress()} mb-6`}
            >
              <Shield className="w-4 h-4 text-white" />
              <span className="font-bold tracking-wider text-sm text-white">FOCUS MODE ACTIVE</span>
            </motion.div>
          )}

          {/* Mode Display */}
          {phase === 'idle' && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {MODES[mode]?.icon || '⚙️'} {MODES[mode]?.name || 'Custom'} Mode
              </h1>
              <p className="text-white/60">
                {mode === 'custom' ? `${customFocus} min focus / ${customBreak} min break` : `${MODES[mode].focus} min focus / ${MODES[mode].break} min break`}
              </p>
            </div>
          )}

          {/* Motivational Quote */}
          {phase === 'focus' && (
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mb-4"
            >
              <p className="text-xl font-semibold text-white mb-2">{FOCUS_QUOTES[quoteIndex]}</p>
              <p className="text-purple-400 font-bold">{getMilestone()}</p>
            </motion.div>
          )}

          {/* Timer Circle */}
          <div className="relative w-[320px] h-[320px] mb-12">
            {/* Animated Ring */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-4 border-white/5"
            />
            
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle 
                cx="160" cy="160" r="140" 
                stroke="currentColor" 
                strokeWidth="16" 
                fill="transparent" 
                className="text-white/5"
              />
              <motion.circle
                cx="160" cy="160" r="140"
                stroke="url(#gradient)"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 140}
                strokeDashoffset={2 * Math.PI * 140 * (1 - getProgress() / 100)}
                className="transition-all duration-1000 ease-linear drop-shadow-[0_0_20px_currentColor]"
                strokeLinecap="round"
                animate={timeLeft <= 60 && phase === 'focus' ? { 
                  filter: ['drop-shadow(0 0 20px currentColor)', 'drop-shadow(0 0 40px currentColor)', 'drop-shadow(0 0 20px currentColor)']
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`text-${themeColor}-400`} stopColor="currentColor" />
                  <stop offset="100%" className={`text-${themeColor}-600`} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>

            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-black tabular-nums tracking-tighter text-white">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-white/40 mt-2 font-mono">
                {Math.round(getProgress())}% Complete
              </div>
              {completedSessions > 0 && (
                <div className="text-xs text-purple-400 font-bold mt-2">
                  🔥 {completedSessions}x Streak Multiplier
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {phase === 'idle' && (
              <Button
                onClick={handleStart}
                size="lg"
                className={`rounded-2xl h-16 px-12 font-bold text-lg shadow-lg bg-gradient-to-r ${getColorByProgress()} hover:scale-105 transition-transform`}
              >
                <Play className="w-6 h-6 mr-2" />
                Start Focus
              </Button>
            )}
            
            {phase === 'focus' && (
              <>
                {!isActive ? (
                  <Button
                    onClick={handleResume}
                    size="lg"
                    className="rounded-2xl h-16 px-12 font-bold text-lg shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    size="lg"
                    variant="outline"
                    className="rounded-2xl h-16 px-12 font-bold text-lg border-white/20 hover:bg-white/5"
                  >
                    <Pause className="w-6 h-6 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button
                  onClick={handleReset}
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-16 px-8 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userProfile?.currentStreak || 0}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userProfile?.totalPoints || 0}</div>
              <div className="text-xs text-white/60">Total Points</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{pauseCount}</div>
              <div className="text-xs text-white/60">Pauses</div>
            </div>
          </div>

          {/* Focus Tip */}
          {phase === 'focus' && (
            <div className="glass-card rounded-2xl p-4 mt-8 max-w-md">
              <p className="text-xs text-white/60 text-center leading-relaxed">
                💡 <span className="font-semibold">Pro tip:</span> Stay off social media until your break. You're building incredible willpower! 💪
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}