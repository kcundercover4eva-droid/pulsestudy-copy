import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import XPPopup from '../rewards/XPPopup';
import { toast } from 'sonner';

export default function QuizFeed({ selectedDeck = null, onBack = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState([]);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isCritical, setIsCritical] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  const { data: allQuizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', selectedDeck?.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (selectedDeck) {
        return base44.entities.Quiz.filter({ sourceId: selectedDeck.id, created_by: user.email, isCompleted: false });
      }
      return base44.entities.Quiz.filter({ created_by: user.email, isCompleted: false });
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { totalPoints: 0 };
    },
  });

  const { data: activeEvents = [] } = useQuery({
    queryKey: ['randomEvents'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const events = await base44.entities.RandomEvent.filter({ 
        created_by: user.email,
        isActive: true
      });
      return events.filter(event => {
        if (!event.expiresAt) return true;
        return new Date(event.expiresAt) > new Date();
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles[0]) {
        return await base44.entities.UserProfile.update(profiles[0].id, updates);
      }
      return await base44.entities.UserProfile.create(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.UserInteraction.create(data),
  });

  // Adaptive difficulty: filter and sort quizzes based on current difficulty
  const quizzes = React.useMemo(() => {
    if (!allQuizzes.length) return [];
    
    // Group by difficulty
    const easy = allQuizzes.filter(q => q.difficulty === 'easy');
    const medium = allQuizzes.filter(q => q.difficulty === 'medium');
    const hard = allQuizzes.filter(q => q.difficulty === 'hard');
    
    // Build adaptive queue
    let adaptiveQueue = [];
    if (currentDifficulty === 'easy') {
      adaptiveQueue = [...easy, ...medium];
    } else if (currentDifficulty === 'hard') {
      adaptiveQueue = [...hard, ...medium];
    } else {
      adaptiveQueue = [...medium, ...hard, ...easy];
    }
    
    return adaptiveQueue.length > 0 ? adaptiveQueue : allQuizzes;
  }, [allQuizzes, currentDifficulty]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading quizzes...</div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-white mb-2">No Quizzes Available</h2>
        <p className="text-white/60">Upload study material to generate quizzes</p>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / quizzes.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <Trophy className="w-24 h-24 text-yellow-400 mb-4 mx-auto" />
            <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
            <div className="text-6xl font-bold text-white mb-4">{percentage}%</div>
            <p className="text-xl text-white/80 mb-2">
              You got {score} out of {quizzes.length} correct
            </p>
            <div className="text-3xl font-bold text-yellow-400 mt-4">
              +{sessionXP} XP Earned!
            </div>
          </div>

          {/* Detailed Results */}
          <Card className="bg-slate-800/50 border border-white/10 p-6 mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">Review Your Answers</h3>
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">{result.question}</p>
                      <div className="text-sm space-y-1">
                        <p className={result.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          Your answer: {result.userAnswer}
                        </p>
                        {!result.isCorrect && (
                          <p className="text-green-400">
                            Correct answer: {result.correctAnswer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setCompleted(false);
                setShowResult(false);
                setSelectedAnswer(null);
                setResults([]);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="border-white/20 hover:bg-white/5"
              >
                Back to Materials
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === currentQuiz.answer;
    const questionDifficulty = currentQuiz.difficulty || 'medium';
    
    // Track result
    setResults([...results, {
      question: currentQuiz.question,
      userAnswer: answer,
      correctAnswer: currentQuiz.answer,
      isCorrect,
      difficulty: questionDifficulty
    }]);
    
    if (isCorrect) {
      setScore(score + 1);
      
      // Calculate XP with critical hit chance
      const baseXP = questionDifficulty === 'easy' ? 10 : questionDifficulty === 'hard' ? 30 : 20;
      const criticalHit = Math.random() < 0.1; // 10% chance
      const eventMultiplier = activeEvents.find(e => e.subject === currentQuiz.subject || e.subject === 'all')?.multiplier || 1;
      const finalXP = Math.round(baseXP * (criticalHit ? 2 : 1) * eventMultiplier);
      
      setEarnedXP(finalXP);
      setIsCritical(criticalHit);
      setShowXPPopup(true);
      setSessionXP(prev => prev + finalXP);
      
      // Update streaks for adaptive difficulty
      const newCorrectStreak = correctStreak + 1;
      setCorrectStreak(newCorrectStreak);
      setIncorrectStreak(0);
      
      // Adaptive difficulty logic
      if (questionDifficulty === 'medium' && newCorrectStreak >= 3) {
        setCurrentDifficulty('hard');
        toast.success('🔥 Difficulty increased! You\'re crushing it!');
      } else if (questionDifficulty === 'easy' && newCorrectStreak >= 3) {
        setCurrentDifficulty('medium');
      }
      
      // Award XP to profile
      updateProfileMutation.mutate({
        totalPoints: (userProfile?.totalPoints || 0) + finalXP
      });
      
      // Track interaction
      createInteractionMutation.mutate({
        contentId: currentQuiz.id,
        interactionType: 'completed',
        wasSuccessful: true,
        difficulty: questionDifficulty,
        accuracy: 1,
        timeSpent: 0
      });
      
      confetti({
        particleCount: criticalHit ? 150 : 50,
        spread: criticalHit ? 100 : 60,
        origin: { y: 0.6 }
      });
    } else {
      // Handle incorrect answer
      const newIncorrectStreak = incorrectStreak + 1;
      setIncorrectStreak(newIncorrectStreak);
      setCorrectStreak(0);
      
      // Adaptive difficulty logic - make it easier
      if (questionDifficulty === 'hard' && newIncorrectStreak >= 1) {
        setCurrentDifficulty('medium');
        toast.info('💡 Let\'s review some fundamentals first');
      } else if (questionDifficulty === 'medium' && newIncorrectStreak >= 2) {
        setCurrentDifficulty('easy');
        toast.info('📚 Let\'s build up from the basics');
      }
      
      createInteractionMutation.mutate({
        contentId: currentQuiz.id,
        interactionType: 'completed',
        wasSuccessful: false,
        difficulty: questionDifficulty,
        accuracy: 0,
        timeSpent: 0
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShortAnswer('');
    } else {
      // Check if we should increment streak (only once per day)
      const today = new Date().toISOString().split('T')[0];
      const lastStreakDate = userProfile?.lastStreakDate 
        ? new Date(userProfile.lastStreakDate).toISOString().split('T')[0] 
        : null;
      
      const shouldIncrementStreak = lastStreakDate !== today;
      const newStreak = shouldIncrementStreak 
        ? (userProfile?.currentStreak || 0) + 1 
        : (userProfile?.currentStreak || 0);
      
      // Reward for completion
      updateProfileMutation.mutate({
        totalPoints: (userProfile?.totalPoints || 0) + 100,
        currentStreak: newStreak,
        lastStreakDate: shouldIncrementStreak ? today : userProfile?.lastStreakDate
      });
      
      setCompleted(true);
      confetti({ particleCount: 150, spread: 100 });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <XPPopup 
        show={showXPPopup} 
        xp={earnedXP} 
        isCritical={isCritical}
        onComplete={() => setShowXPPopup(false)}
      />
      
      {onBack && (
        <button
          onClick={onBack}
          className="self-start mb-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Change Material</span>
        </button>
      )}
      {selectedDeck && (
        <div className="w-full max-w-2xl mb-4 text-center">
          <h2 className="text-2xl font-bold text-white">{selectedDeck.title}</h2>
        </div>
      )}
      {/* Progress */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex justify-between text-white/60 text-sm mb-2">
          <span>Question {currentIndex + 1} of {quizzes.length}</span>
          <div className="flex items-center gap-4">
            <span>Score: {score}/{currentIndex}</span>
            <span className="text-yellow-400 font-bold">Session XP: {sessionXP}</span>
            {currentDifficulty !== 'medium' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                currentDifficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {currentDifficulty.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Quiz Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 p-8">
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-purple-400 uppercase tracking-wide">
                  {currentQuiz.type === 'multiple_choice' && 'Multiple Choice'}
                  {currentQuiz.type === 'true_false' && 'True or False'}
                  {currentQuiz.type === 'short_answer' && 'Short Answer'}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('StudyAssistant'), {
                    state: {
                      initialQuestion: currentQuiz.question,
                      subject: currentQuiz.subject || 'General',
                      topic: selectedDeck?.title
                    }
                  })}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Get Help
                </Button>
              </div>
              <h3 className="text-2xl font-bold text-white leading-relaxed">
                {currentQuiz.question}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            {currentQuiz.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuiz.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuiz.answer;
                  const showCorrectness = showResult && (isSelected || isCorrect);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : isSelected
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-slate-700/50 border border-slate-600'
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{option}</span>
                        {showCorrectness && (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : null
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False Options */}
            {currentQuiz.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuiz.answer;
                  const showCorrectness = showResult && (isSelected || isCorrect);
                  
                  return (
                    <button
                      key={option}
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
                      className={`p-6 rounded-xl text-center transition-all ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : isSelected
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-slate-700/50 border border-slate-600'
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl font-bold text-white">{option}</span>
                        {showCorrectness && (
                          isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : isSelected ? (
                            <XCircle className="w-6 h-6 text-red-400" />
                          ) : null
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQuiz.type === 'short_answer' && (
              <div className="space-y-4">
                <Input
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={showResult}
                  className="bg-slate-700 border-slate-600 text-white text-lg p-4"
                />
                {!showResult && (
                  <Button
                    onClick={() => handleAnswer(shortAnswer)}
                    disabled={!shortAnswer.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Submit Answer
                  </Button>
                )}
                {showResult && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Correct Answer:</div>
                    <div className="text-white font-medium">{currentQuiz.answer}</div>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg py-6"
                >
                  {currentIndex < quizzes.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}