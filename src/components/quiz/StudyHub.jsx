import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Brain, Layers, FileText, ArrowLeft } from 'lucide-react';
import QuizFeed from './QuizFeed';
import FlashcardFeed from './FlashcardFeed';
import NotecardFeed from './NotecardFeed';
import DeckManager from './DeckManager';

export default function StudyHub() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedQuizDeck, setSelectedQuizDeck] = useState(null);
  const [selectedNoteDeck, setSelectedNoteDeck] = useState(null);

  // Fetch user profile for accent color
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { accentColor: 'neonGreen' };
    },
  });

  const accentColor = userProfile?.accentColor || 'neonGreen';
  const colorMap = {
    neonGreen: { quiz: 'from-green-600 to-green-800 border-green-500 shadow-green-500/50', flashcard: 'from-emerald-600 to-emerald-800 border-emerald-500 shadow-emerald-500/50', note: 'from-teal-600 to-teal-800 border-teal-500 shadow-teal-500/50' },
    coral: { quiz: 'from-rose-600 to-rose-800 border-rose-500 shadow-rose-500/50', flashcard: 'from-pink-600 to-pink-800 border-pink-500 shadow-pink-500/50', note: 'from-red-600 to-red-800 border-red-500 shadow-red-500/50' },
    electricBlue: { quiz: 'from-blue-600 to-blue-800 border-blue-500 shadow-blue-500/50', flashcard: 'from-cyan-600 to-cyan-800 border-cyan-500 shadow-cyan-500/50', note: 'from-sky-600 to-sky-800 border-sky-500 shadow-sky-500/50' }
  };
  const colors = colorMap[accentColor];

  // Debug logging
  React.useEffect(() => {
    console.log('StudyHub state:', { selectedMode, selectedDeck, selectedQuizDeck, selectedNoteDeck });
  }, [selectedMode, selectedDeck, selectedQuizDeck, selectedNoteDeck]);

  if (selectedMode === 'quiz' && !selectedQuizDeck) {
    return (
      <DeckManager
        mode="quiz"
        onSelectDeck={setSelectedQuizDeck}
        onBack={() => setSelectedMode(null)}
      />
    );
  }

  if (selectedMode === 'quiz' && selectedQuizDeck) {
    return (
      <div className="h-full">
        <QuizFeed 
          selectedDeck={selectedQuizDeck}
          onBack={() => setSelectedQuizDeck(null)}
        />
      </div>
    );
  }

  if (selectedMode === 'flashcards' && !selectedDeck) {
    return (
      <DeckManager
        mode="flashcards"
        onSelectDeck={setSelectedDeck}
        onBack={() => setSelectedMode(null)}
      />
    );
  }

  if (selectedMode === 'flashcards' && selectedDeck) {
    return (
      <div className="h-full">
        <FlashcardFeed 
          selectedDeck={selectedDeck}
          onBack={() => setSelectedDeck(null)}
        />
      </div>
    );
  }

  if (selectedMode === 'notes' && !selectedNoteDeck) {
    return (
      <DeckManager
        mode="notes"
        onSelectDeck={setSelectedNoteDeck}
        onBack={() => setSelectedMode(null)}
      />
    );
  }

  if (selectedMode === 'notes' && selectedNoteDeck) {
    return (
      <div className="h-full">
        <NotecardFeed 
          selectedDeck={selectedNoteDeck}
          onBack={() => setSelectedNoteDeck(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Study Tools</h1>
        <p className="text-white/60 text-sm md:text-base">Choose how you want to study</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mx-auto">
        {/* Quiz */}
          <motion.button
            onClick={() => setSelectedMode('quiz')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className={`bg-gradient-to-br ${colors.quiz} border-2 p-6 md:p-8 text-center cursor-pointer hover:shadow-2xl transition-all`}>
              <Brain className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Quiz</h3>
              <p className="text-white/80 text-xs md:text-sm">Test your knowledge with interactive quizzes</p>
            </Card>
          </motion.button>

          {/* Flashcards */}
          <motion.button
            onClick={() => setSelectedMode('flashcards')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className={`bg-gradient-to-br ${colors.flashcard} border-2 p-6 md:p-8 text-center cursor-pointer hover:shadow-2xl transition-all`}>
              <Layers className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Flashcards</h3>
              <p className="text-white/80 text-xs md:text-sm">Review with swipeable flashcards</p>
            </Card>
          </motion.button>

          {/* Notes */}
          <motion.button
            onClick={() => setSelectedMode('notes')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className={`bg-gradient-to-br ${colors.note} border-2 p-6 md:p-8 text-center cursor-pointer hover:shadow-2xl transition-all`}>
              <FileText className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Notes</h3>
              <p className="text-white/80 text-xs md:text-sm">Read concise study notes</p>
              </Card>
              </motion.button>
              </div>
              </div>
              );
}