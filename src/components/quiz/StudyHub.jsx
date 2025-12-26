import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Brain, Layers, FileText, ArrowLeft } from 'lucide-react';
import QuizFeed from './QuizFeed';
import FlashcardFeed from './FlashcardFeed';
import NotecardFeed from './NotecardFeed';

export default function StudyHub() {
  const [selectedMode, setSelectedMode] = useState(null);

  if (selectedMode === 'quiz') {
    return (
      <div className="h-full">
        <button
          onClick={() => setSelectedMode(null)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <QuizFeed />
      </div>
    );
  }

  if (selectedMode === 'flashcards') {
    return (
      <div className="h-full">
        <button
          onClick={() => setSelectedMode(null)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <FlashcardFeed />
      </div>
    );
  }

  if (selectedMode === 'notes') {
    return (
      <div className="h-full">
        <button
          onClick={() => setSelectedMode(null)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <NotecardFeed />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Study Tools</h1>
        <p className="text-white/60">Choose how you want to study</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {/* Quiz */}
        <motion.button
          onClick={() => setSelectedMode('quiz')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-500 p-8 text-center cursor-pointer hover:shadow-2xl hover:shadow-purple-500/50 transition-all">
            <Brain className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Quiz</h3>
            <p className="text-white/80 text-sm">Test your knowledge with interactive quizzes</p>
          </Card>
        </motion.button>

        {/* Flashcards */}
        <motion.button
          onClick={() => setSelectedMode('flashcards')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-500 p-8 text-center cursor-pointer hover:shadow-2xl hover:shadow-blue-500/50 transition-all">
            <Layers className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Flashcards</h3>
            <p className="text-white/80 text-sm">Review with swipeable flashcards</p>
          </Card>
        </motion.button>

        {/* Notes */}
        <motion.button
          onClick={() => setSelectedMode('notes')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-gradient-to-br from-green-600 to-green-800 border-2 border-green-500 p-8 text-center cursor-pointer hover:shadow-2xl hover:shadow-green-500/50 transition-all">
            <FileText className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Notes</h3>
            <p className="text-white/80 text-sm">Read concise study notes</p>
          </Card>
        </motion.button>
      </div>
    </div>
  );
}