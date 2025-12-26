import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Brain, Layers, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Card Component
const Card = ({ data, onSwipe, index }) => {
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
          className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-white/10 shadow-2xl bg-slate-800/95 backdrop-blur-xl"
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
          className="absolute inset-0 glass-card rounded-3xl p-8 flex flex-col justify-between text-center border border-white/10 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-green-400 mb-4 font-bold">Definition</div>
            <h3 className="text-2xl font-medium leading-relaxed text-white/90 px-4">{data.answer}</h3>
          </div>
          
          <div className="flex justify-center gap-12 text-sm font-bold pb-4">
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function FlashcardFeed() {
  const queryClient = useQueryClient();
  const [swipedCards, setSwipedCards] = useState(0);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: () => base44.entities.Flashcard.list(),
    initialData: []
  });

  const [activeCards, setActiveCards] = useState([]);

  React.useEffect(() => {
    if (cards.length > 0 && activeCards.length === 0 && swipedCards === 0) {
      setActiveCards(cards);
    }
  }, [cards]);

  const handleSwipe = (direction) => {
    const currentCard = activeCards[0];
    
    // In a real app, update mastery level here
    // direction === 'right' ? mastery++ : mastery--

    setActiveCards(prev => prev.slice(1));
    setSwipedCards(prev => prev + 1);
  };

  const restart = () => {
    setActiveCards(cards);
    setSwipedCards(0);
  };

  if (isLoading) return <div className="p-10 text-center">Loading deck...</div>;

  return (
    <div className="h-[calc(100vh-100px)] w-full max-w-md mx-auto relative flex flex-col">
      <div className="flex justify-between items-center mb-6 px-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Study Mode
          </h2>
          <p className="text-white/40 text-sm">Swipe left to review later, right if you know it.</p>
        </div>
        <div className="text-right">
           <span className="text-2xl font-bold text-white">{cards.length - activeCards.length}</span>
           <span className="text-white/40 text-sm"> / {cards.length}</span>
        </div>
      </div>

      <div className="flex-1 relative w-full perspective-1000">
        <AnimatePresence>
          {activeCards.map((card, index) => (
            index < 3 && (
              <Card 
                key={card.id || index} 
                data={card} 
                index={index} 
                onSwipe={handleSwipe} 
              />
            )
          ))}
        </AnimatePresence>

        {activeCards.length === 0 && cards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center glass rounded-3xl p-8"
          >
            <Trophy className="w-20 h-20 text-yellow-400 mb-4" />
            <h3 className="text-3xl font-bold mb-2">Session Complete!</h3>
            <p className="text-white/60 mb-8">You reviewed {cards.length} cards.</p>
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