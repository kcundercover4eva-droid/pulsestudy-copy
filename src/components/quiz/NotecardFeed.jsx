import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';

export default function NotecardFeed({ selectedDeck = null, onBack = null }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: notecards = [], isLoading } = useQuery({
    queryKey: ['notecards', selectedDeck?.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (selectedDeck) {
        return base44.entities.Notecard.filter({ sourceId: selectedDeck.id, created_by: user.email });
      }
      return base44.entities.Notecard.filter({ created_by: user.email });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading notes...</div>
      </div>
    );
  }

  if (notecards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-white mb-2">No Notes Available</h2>
        <p className="text-white/60">Upload study material to generate notes</p>
      </div>
    );
  }

  const currentNote = notecards[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < notecards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
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
          <span>Note {currentIndex + 1} of {notecards.length}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / notecards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Notecard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/30 p-8 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-green-400" />
              <h3 className="text-2xl font-bold text-white">{currentNote.topic}</h3>
            </div>

            <div className="flex-1 flex items-center">
              <p className="text-xl text-white/90 leading-relaxed">
                {currentNote.summary}
              </p>
            </div>

            {currentNote.subject && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <span className="text-sm text-white/50 uppercase tracking-wide">
                  {currentNote.subject}
                </span>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-white/20 hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentIndex === notecards.length - 1}
          className="bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-30"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}