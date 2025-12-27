import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Brain, Layers, Trophy, ArrowLeft, Star, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import XPPopup from '../rewards/XPPopup';
import confetti from 'canvas-confetti';

// Card Component
const Card = ({ data, onSwipe, index, markDifficult, markMastered }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const bg = useTransform(x, [-200, 0, 200], ["rgba(239, 68, 68, 0.2)", "rgba(255, 255, 255, 0)", "rgba(34, 197, 94, 0.2)"]);

  // Reset flip state when card changes
  React.useEffect(() => {
    setIsFlipped(false);
  }, [data.id]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing perspective-1000"
      initial={{ scale: 1 - index * 0.05, y: index * 10, opacity: 1 - index * 0.2 }}
      animate={{ scale: 1 - index * 0.05, y: index * 10, opacity: 1 - index * 0.2 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front - Concept/Question */}
        <div 
          className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-white/10 shadow-2xl bg-slate-800"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <motion.div style={{ backgroundColor: bg }} className="absolute inset-0 rounded-3xl" />
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-widest text-cyan-400 mb-4 font-bold">Concept</div>
            <h3 className="text-3xl font-bold leading-tight mb-4">{data.question}</h3>
            <p className="text-white/30 text-sm mt-8 animate-pulse">👆 Tap to see definition</p>
          </div>
        </div>

        {/* Back - Definition/Answer */}
        <div 
          className="absolute inset-0 rounded-3xl p-8 flex flex-col justify-between text-center border border-white/10 shadow-2xl bg-slate-900"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-green-400 mb-4 font-bold">Definition</div>
            <h3 className="text-2xl font-medium leading-relaxed text-white/90 px-4">{data.answer}</h3>
          </div>

          <div className="space-y-4 pb-4">
            <div className="flex justify-center gap-12 text-sm font-bold">
              <div className="flex flex-col items-center text-red-400">
                <X className="w-6 h-6 mb-1" />
                <span>Need Review</span>
                <span className="text-[10px] opacity-50">(Swipe Left)</span>
              </div>
              <div className="flex flex-col items-center text-green-400">
                <Check className="w-6 h-6 mb-1" />
                <span>I Know This</span>
                <span className="text-[10px] opacity-50">(Swipe Right)</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  markDifficult(data);
                }}
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Mark Difficult
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  markMastered(data);
                }}
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
              >
                <Star className="w-3 h-3 mr-1" />
                Mark Mastered
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function FlashcardFeed({ selectedDeck = null, onBack = null }) {
  const queryClient = useQueryClient();
  const [swipedCards, setSwipedCards] = useState(0);
  const [filterMode, setFilterMode] = useState('all');
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isCritical, setIsCritical] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [correctStreak, setCorrectStreak] = useState(0);

  const { data: allCards, isLoading } = useQuery({
    queryKey: ['flashcards', selectedDeck?.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (selectedDeck) {
        return await base44.entities.Flashcard.filter({ sourceId: selectedDeck.id, created_by: user.email });
      }
      return await base44.entities.Flashcard.filter({ created_by: user.email });
    },
    initialData: []
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

  // Adaptive difficulty: filter and prioritize cards based on mastery
  const cards = React.useMemo(() => {
    let filtered = allCards;
    
    if (filterMode === 'difficult') {
      filtered = allCards.filter(card => (card.masteryLevel || 0) <= 1);
    } else if (filterMode === 'mastered') {
      filtered = allCards.filter(card => (card.masteryLevel || 0) >= 4);
    }
    
    // Sort by mastery level (lowest first) for adaptive learning
    return [...filtered].sort((a, b) => (a.masteryLevel || 0) - (b.masteryLevel || 0));
  }, [allCards, filterMode]);

  const updateMasteryMutation = useMutation({
    mutationFn: ({ cardId, masteryLevel }) => 
      base44.entities.Flashcard.update(cardId, { masteryLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries(['flashcards']);
    }
  });

  const [activeCards, setActiveCards] = useState([]);

  React.useEffect(() => {
    setActiveCards(cards);
    setSwipedCards(0);
  }, [selectedDeck?.id]);

  React.useEffect(() => {
    if (cards.length > 0 && activeCards.length === 0 && swipedCards === 0) {
      setActiveCards(cards);
    }
  }, [cards]);

  const handleSwipe = (direction) => {
    const currentCard = activeCards[0];
    const isCorrect = direction === 'right';
    
    // Update mastery level based on swipe
    const currentMastery = currentCard.masteryLevel || 0;
    const newMastery = isCorrect
      ? Math.min(5, currentMastery + 1)
      : Math.max(0, currentMastery - 1);
    
    updateMasteryMutation.mutate({
      cardId: currentCard.id,
      masteryLevel: newMastery
    });

    if (isCorrect) {
      // Award XP with critical hit chance
      const baseXP = 8;
      const criticalHit = Math.random() < 0.1;
      const eventMultiplier = activeEvents.find(e => e.subject === currentCard.subject || e.subject === 'all')?.multiplier || 1;
      const finalXP = Math.round(baseXP * (criticalHit ? 2 : 1) * eventMultiplier);
      
      setEarnedXP(finalXP);
      setIsCritical(criticalHit);
      setShowXPPopup(true);
      setSessionXP(prev => prev + finalXP);
      
      // Update streak
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      
      // Celebrate milestones
      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(`🔥 ${newStreak} card streak!`);
      }
      
      updateProfileMutation.mutate({
        totalPoints: (userProfile?.totalPoints || 0) + finalXP
      });
      
      createInteractionMutation.mutate({
        contentId: currentCard.id,
        interactionType: 'completed',
        wasSuccessful: true,
        accuracy: 1,
        timeSpent: 0
      });
    } else {
      setCorrectStreak(0);
      
      createInteractionMutation.mutate({
        contentId: currentCard.id,
        interactionType: 'completed',
        wasSuccessful: false,
        accuracy: 0,
        timeSpent: 0
      });
    }

    setActiveCards(prev => prev.slice(1));
    setSwipedCards(prev => prev + 1);
  };

  const markDifficult = (card) => {
    updateMasteryMutation.mutate({
      cardId: card.id,
      masteryLevel: 0
    });
    toast.success('Marked as difficult - will appear more often');
  };

  const markMastered = (card) => {
    updateMasteryMutation.mutate({
      cardId: card.id,
      masteryLevel: 5
    });
    toast.success('Marked as mastered!');
  };

  const restart = () => {
    setActiveCards(cards);
    setSwipedCards(0);
  };

  if (isLoading) return <div className="p-10 text-center">Loading deck...</div>;

  return (
    <div className="h-[calc(100vh-100px)] w-full max-w-md mx-auto relative flex flex-col">
      <XPPopup 
        show={showXPPopup} 
        xp={earnedXP} 
        isCritical={isCritical}
        onComplete={() => setShowXPPopup(false)}
      />
      
      {onBack && (
        <div className="px-4 py-3 relative z-[9999]" style={{ touchAction: 'auto' }}>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors active:scale-95 px-2 py-2 -ml-2 rounded-lg hover:bg-white/5"
            style={{ touchAction: 'manipulation' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Change Deck</span>
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            {selectedDeck ? selectedDeck.title : 'Study Mode'}
          </h2>
          <p className="text-white/40 text-sm">Swipe left to review later, right if you know it.</p>
        </div>
        <div className="text-right">
           <div className="text-yellow-400 font-bold text-sm mb-1">+{sessionXP} XP</div>
           <div>
             <span className="text-2xl font-bold text-white">{cards.length - activeCards.length}</span>
             <span className="text-white/40 text-sm"> / {cards.length}</span>
           </div>
           {correctStreak > 0 && (
             <div className="text-orange-400 text-xs font-bold mt-1">
               🔥 {correctStreak} streak
             </div>
           )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 px-4">
        <Button
          size="sm"
          variant={filterMode === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterMode('all')}
          className={filterMode === 'all' ? 'bg-purple-600' : 'border-white/20'}
        >
          All ({allCards.length})
        </Button>
        <Button
          size="sm"
          variant={filterMode === 'difficult' ? 'default' : 'outline'}
          onClick={() => setFilterMode('difficult')}
          className={filterMode === 'difficult' ? 'bg-orange-600' : 'border-white/20'}
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Difficult ({allCards.filter(c => (c.masteryLevel || 0) <= 1).length})
        </Button>
        <Button
          size="sm"
          variant={filterMode === 'mastered' ? 'default' : 'outline'}
          onClick={() => setFilterMode('mastered')}
          className={filterMode === 'mastered' ? 'bg-yellow-600' : 'border-white/20'}
        >
          <Star className="w-3 h-3 mr-1" />
          Mastered ({allCards.filter(c => (c.masteryLevel || 0) >= 4).length})
        </Button>
      </div>

      <div className="flex-1 relative w-full perspective-1000">
        <AnimatePresence>
          {activeCards.map((card, index) => (
            index === 0 && (
              <Card 
                key={card.id || index} 
                data={card} 
                index={index} 
                onSwipe={handleSwipe}
                markDifficult={markDifficult}
                markMastered={markMastered}
              />
            )
          ))}
        </AnimatePresence>

        {activeCards.length === 0 && cards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center glass rounded-3xl p-8"
            onAnimationComplete={() => {
              // Check if we should increment streak (only once per day)
              const today = new Date().toISOString().split('T')[0];
              const lastStreakDate = userProfile?.lastStreakDate 
                ? new Date(userProfile.lastStreakDate).toISOString().split('T')[0] 
                : null;
              
              const shouldIncrementStreak = lastStreakDate !== today;
              const newStreak = shouldIncrementStreak 
                ? (userProfile?.currentStreak || 0) + 1 
                : (userProfile?.currentStreak || 0);
              
              // Reward streak for completing all cards
              if (shouldIncrementStreak) {
                updateProfileMutation.mutate({
                  currentStreak: newStreak,
                  lastStreakDate: today
                });
                confetti({ particleCount: 150, spread: 100 });
              }
            }}
          >
            <Trophy className="w-20 h-20 text-yellow-400 mb-4" />
            <h3 className="text-3xl font-bold mb-2">Session Complete!</h3>
            <p className="text-white/60 mb-2">You reviewed {cards.length} cards.</p>
            <div className="text-3xl font-bold text-yellow-400 mb-8">+{sessionXP} XP</div>
            <Button onClick={restart} className="bg-white text-black font-bold rounded-xl h-12 px-8">
              <RotateCcw className="w-4 h-4 mr-2" />
              Review Again
            </Button>
          </motion.div>
        )}
        
        {cards.length === 0 && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white/40">
             <Layers className="w-16 h-16 mb-4 opacity-50" />
             <p>Upload study material to generate flashcards</p>
           </div>
        )}
      </div>
    </div>
  );
}