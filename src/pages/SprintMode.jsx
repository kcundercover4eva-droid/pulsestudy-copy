import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Trophy, ArrowLeft, Timer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import XPPopup from '../components/rewards/XPPopup';

export default function SprintMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState('setup'); // setup, active, complete
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const { data: initialQuizzes = [] } = useQuery({
    queryKey: ['sprintQuizzes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const allQuizzes = await base44.entities.Quiz.filter({ 
        created_by: user.email,
        isCompleted: false
      });
      // Filter to only include questions with proper answer formats
      const validQuizzes = allQuizzes.filter(quiz => {
        // Must have options array OR be true_false type
        const hasOptions = quiz.options && quiz.options.length > 0;
        const isTrueFalse = quiz.type === 'true_false';
        return hasOptions || isTrueFalse;
      });
      
      // Group by sourceId to mix uploads
      const bySource = {};
      validQuizzes.forEach(quiz => {
        const sourceId = quiz.sourceId || 'no_source';
        if (!bySource[sourceId]) bySource[sourceId] = [];
        bySource[sourceId].push(quiz);
      });
      
      // Randomly pick from different sources
      const selectedQuizzes = [];
      const sourceIds = Object.keys(bySource);
      const targetCount = Math.min(10, validQuizzes.length);
      
      while (selectedQuizzes.length < targetCount && validQuizzes.length > 0) {
        // Pick random source
        const randomSource = sourceIds[Math.floor(Math.random() * sourceIds.length)];
        const sourceQuizzes = bySource[randomSource];
        
        if (sourceQuizzes.length > 0) {
          // Pick random quiz from that source
          const randomIndex = Math.floor(Math.random() * sourceQuizzes.length);
          selectedQuizzes.push(sourceQuizzes[randomIndex]);
          sourceQuizzes.splice(randomIndex, 1);
        }
        
        // Remove empty sources
        if (bySource[randomSource].length === 0) {
          delete bySource[randomSource];
          sourceIds.splice(sourceIds.indexOf(randomSource), 1);
        }
      }
      
      return selectedQuizzes;
    },
  });

  // Initialize quizzes when data loads
  useEffect(() => {
    if (initialQuizzes.length > 0 && quizzes.length === 0) {
      setQuizzes(initialQuizzes);
    }
  }, [initialQuizzes]);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { totalPoints: 0 };
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles[0]) {
        return await base44.entities.UserProfile.update(profiles[0].id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  useEffect(() => {
    if (phase === 'active' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    if (showXPPopup) {
      const timer = setTimeout(() => {
        setShowXPPopup(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showXPPopup]);

  const startSprint = (duration) => {
    setTimeLeft(duration);
    setPhase('active');
  };

  const generateMoreQuestions = async () => {
    if (isGeneratingQuestions) return;
    
    setIsGeneratingQuestions(true);
    try {
      const user = await base44.auth.me();
      
      // Get the subject/topic from existing quizzes
      const existingSubjects = quizzes.map(q => q.subject).filter(Boolean);
      const subject = existingSubjects[0] || 'general knowledge';
      
      // Generate 3 more questions
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 multiple choice quiz questions about ${subject}. Make them challenging and probing to test deep understanding.
        
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "question text here",
    "options": ["option1", "option2", "option3", "option4"],
    "answer": "correct option text",
    "subject": "${subject}",
    "type": "multiple_choice"
  }
]`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  answer: { type: "string" },
                  subject: { type: "string" },
                  type: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newQuestions = response.questions || [];
      
      // Create quiz records
      for (const q of newQuestions) {
        await base44.entities.Quiz.create({
          question: q.question,
          options: q.options,
          answer: q.answer,
          subject: q.subject,
          type: q.type,
          isCompleted: false
        });
      }
      
      // Add to current quiz pool
      setQuizzes(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      const xp = 15; // Quick XP for sprint mode
      setScore(prev => prev + 1);
      setTotalXP(prev => prev + xp);
      setEarnedXP(xp);
      setShowXPPopup(true);
      
      updateProfileMutation.mutate({
        totalPoints: (userProfile?.totalPoints || 0) + xp
      });
    }

    // Check if we're running low on questions
    const questionsRemaining = quizzes.length - currentQuizIndex - 1;
    if (questionsRemaining <= 2 && phase === 'active' && !isGeneratingQuestions) {
      generateMoreQuestions();
    }

    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
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
        currentStreak: newStreak,
        lastStreakDate: shouldIncrementStreak ? today : userProfile?.lastStreakDate
      });

      setPhase('complete');
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 }
      });
    };

  const currentQuiz = quizzes[currentQuizIndex];

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full glass-card rounded-3xl p-8 text-center"
        >
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="absolute top-6 left-6 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Zap className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-bold text-white mb-4">Sprint Mode ⚡</h1>
          <p className="text-white/60 mb-8">
            Quick-fire questions. Beat the clock. Earn massive XP!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => startSprint(120)}
              className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all border-2 border-transparent hover:border-purple-500"
            >
              <Timer className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">2 Min</div>
              <div className="text-white/60 text-sm">Quick Burst</div>
            </button>

            <button
              onClick={() => startSprint(300)}
              className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all border-2 border-transparent hover:border-purple-500"
            >
              <Timer className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">5 Min</div>
              <div className="text-white/60 text-sm">Speed Run</div>
            </button>

            <button
              onClick={() => startSprint(600)}
              className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all border-2 border-transparent hover:border-purple-500"
            >
              <Timer className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">10 Min</div>
              <div className="text-white/60 text-sm">Power Session</div>
            </button>
          </div>

          <p className="text-white/40 text-sm">
            Answer as many questions as you can before time runs out!
          </p>
        </motion.div>
      </div>
    );
  }

  if (phase === 'active' && currentQuiz) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <XPPopup 
          show={showXPPopup} 
          xp={earnedXP}
          onComplete={() => setShowXPPopup(false)}
        />

        {/* Timer and Score */}
        <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center">
          <div className="glass px-6 py-3 rounded-full">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="glass px-6 py-3 rounded-full">
            <div className="text-white font-bold">
              Score: {score} | +{totalXP} XP
            </div>
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuizIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card rounded-3xl p-8">
              <div className="text-sm text-purple-400 mb-4">
                Question {currentQuizIndex + 1} of {quizzes.length}
              </div>
              <h2 className="text-2xl font-bold text-white mb-6">{currentQuiz.question}</h2>

              {currentQuiz.options && currentQuiz.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQuiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option === currentQuiz.answer)}
                      className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-purple-500 text-white text-left transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : currentQuiz.type === 'true_false' ? (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map(option => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option === currentQuiz.answer)}
                      className="p-6 rounded-xl bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-purple-500 text-white font-bold transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <p className="mb-4">This question type is not supported in Sprint Mode</p>
                  <Button onClick={() => handleAnswer(false)} variant="outline">
                    Skip Question
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'complete') {
    const isNegative = userProfile?.motivationStyle === 'negative';
    const accuracy = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full glass-card rounded-3xl p-8 text-center"
        >
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">
            {isNegative ? "Time's Up. 💀" : "Sprint Complete! 🎉"}
          </h1>
          <p className="text-white/60 mb-6">
            {isNegative 
              ? (accuracy >= 80 ? "Not terrible. But can you do it again?" : accuracy >= 50 ? "Mediocre performance. You need to study harder." : "That was embarrassing. Hit the books.")
              : (accuracy >= 80 ? "Amazing work! You're on fire! 🔥" : accuracy >= 50 ? "Great effort! Keep practicing! 💪" : "Good try! You'll improve with practice! ⭐")
            }
          </p>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6 rounded-xl">
              <div className="text-white/60 text-sm mb-1">Score</div>
              <div className="text-4xl font-bold text-white">{score}</div>
              <div className="text-white/40 text-xs">out of {quizzes.length}</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-white/60 text-sm mb-1">XP Earned</div>
              <div className="text-4xl font-bold text-yellow-400">{totalXP}</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                setPhase('setup');
                setScore(0);
                setTotalXP(0);
                setCurrentQuizIndex(0);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Another Sprint
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              variant="outline"
              className="border-white/20"
            >
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}