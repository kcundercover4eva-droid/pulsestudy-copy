import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Layers, Edit2, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function DeckManager({ mode = 'flashcards', onSelectDeck, onBack }) {
  const queryClient = useQueryClient();
  const [editingDeck, setEditingDeck] = useState(null);
  const [deckToDelete, setDeckToDelete] = useState(null);

  const headings = {
    flashcards: { title: 'Your Flashcard Decks', subtitle: 'Choose a deck to study' },
    quiz: { title: 'Quiz Stuff', subtitle: 'Choose material to quiz yourself on' },
    notes: { title: 'Notable Notes', subtitle: 'Choose material to review' }
  };

  const heading = headings[mode] || headings.flashcards;

  // Fetch all study materials (decks)
  const { data: decks, isLoading } = useQuery({
    queryKey: ['studyMaterials'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const materials = await base44.entities.StudyMaterial.filter({ created_by: user.email }, '-created_date');
      // Fetch flashcard counts for each deck
      const allFlashcards = await base44.entities.Flashcard.filter({ created_by: user.email });
      
      console.log('DeckManager - Materials:', materials);
      console.log('DeckManager - All Flashcards:', allFlashcards);
      
      const decksWithCounts = materials.map(deck => {
        const count = allFlashcards.filter(f => f.sourceId === deck.id).length;
        console.log(`Deck "${deck.title}" (${deck.id}): ${count} flashcards`);
        return {
          ...deck,
          flashcardCount: count
        };
      });
      
      console.log('DeckManager - Final decks:', decksWithCounts);
      return decksWithCounts;
    },
  });

  // Update deck mutation
  const updateDeckMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudyMaterial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['studyMaterials']);
      setEditingDeck(null);
      toast.success('Deck updated!');
    },
  });

  // Delete deck mutation
  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId) => {
      // Delete all flashcards in this deck
      const flashcards = await base44.entities.Flashcard.filter({ sourceId: deckId });
      await Promise.all(flashcards.map(f => base44.entities.Flashcard.delete(f.id)));
      // Delete the deck
      await base44.entities.StudyMaterial.delete(deckId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studyMaterials']);
      queryClient.invalidateQueries(['flashcards']);
      setDeckToDelete(null);
      toast.success('Deck deleted!');
    },
  });

  const handleSaveDeck = () => {
    if (editingDeck) {
      updateDeckMutation.mutate({
        id: editingDeck.id,
        data: {
          title: editingDeck.title,
          subject: editingDeck.subject
        }
      });
    }
  };

  const subjectColors = {
    math: 'bg-blue-500',
    science: 'bg-green-500',
    history: 'bg-amber-500',
    english: 'bg-purple-500',
    coding: 'bg-cyan-500',
    art: 'bg-pink-500',
    music: 'bg-indigo-500',
    other: 'bg-gray-500'
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60">Loading decks...</div>
      </div>
    );
  }

  // Temporarily show all decks for debugging
  const validDecks = decks || [];
  console.log('Valid decks after filter:', validDecks);

  return (
    <div className="h-full flex flex-col p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="text-center mb-3">
        <h1 className="text-4xl font-bold text-white mb-2">{heading.title}</h1>
        <p className="text-white/60">{heading.subtitle}</p>
      </div>

      {validDecks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/40">
          <Layers className="w-16 h-16 mb-4" />
          <p>No flashcard decks yet</p>
          <p className="text-sm">Upload study materials to create decks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
          {validDecks.map((deck) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-slate-800/50 border border-white/10 p-6 cursor-pointer hover:bg-slate-800/70 transition-all"
                onClick={() => onSelectDeck(deck)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{deck.title}</h3>
                    <Badge className={`${subjectColors[deck.subject]} text-white mb-2`}>
                      {deck.subject}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDeck(deck);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeckToDelete(deck);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/60">
                  <Layers className="w-4 h-4" />
                  <span className="text-2xl font-bold text-white">{deck.flashcardCount}</span>
                  <span className="text-sm">cards</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Deck Dialog */}
      <Dialog open={!!editingDeck} onOpenChange={() => setEditingDeck(null)}>
        <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Deck Name</label>
              <Input
                value={editingDeck?.title || ''}
                onChange={(e) => setEditingDeck({ ...editingDeck, title: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Subject</label>
              <Select
                value={editingDeck?.subject || 'other'}
                onValueChange={(value) => setEditingDeck({ ...editingDeck, subject: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveDeck}
              disabled={updateDeckMutation.isPending}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deckToDelete} onOpenChange={() => setDeckToDelete(null)}>
        <DialogContent className="glass bg-slate-900/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Deck?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white/80 mb-4">
              Are you sure you want to delete "<span className="font-bold">{deckToDelete?.title}</span>"?
            </p>
            <p className="text-white/60 text-sm">
              This will permanently delete all {deckToDelete?.flashcardCount} flashcards in this deck.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeckToDelete(null)}
              className="border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteDeckMutation.mutate(deckToDelete.id)}
              disabled={deleteDeckMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Deck
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}