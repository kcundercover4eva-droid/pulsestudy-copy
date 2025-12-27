import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function GenerateContent() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('other');
  const [file, setFile] = useState(null);

  const { data: materials = [] } = useQuery({
    queryKey: ['studyMaterials'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.StudyMaterial.filter({ created_by: user.email }, '-created_date');
    },
  });

  // Fetch user profile for accent color
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles[0] || { accentColor: 'neonGreen' };
    },
  });

  const accentColor = userProfile?.accentColor || 'neonGreen';
  const gradientMap = {
    neonGreen: 'from-green-600 to-emerald-600',
    coral: 'from-rose-600 to-pink-600',
    electricBlue: 'from-cyan-600 to-blue-600'
  };
  const gradient = gradientMap[accentColor];

  const generateMutation = useMutation({
    mutationFn: async ({ title, subject, file }) => {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create material record
      const material = await base44.entities.StudyMaterial.create({
        title,
        subject,
        fileUrl: file_url,
        status: 'processing',
      });

      // Generate content using AI with quality filters
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert tutor creating high-quality study materials from uploaded documents. Your goal: extract ONLY the most important, exam-useful information.

**EXTRACTION RULES:**
• IGNORE: filler text, formatting noise, disclaimers, headers/footers, citations, page numbers, repeated content
• FOCUS ON: core concepts, definitions, key facts, formulas, processes, important relationships, testable information
• Prioritize what a teacher would test or what appears in study guides
• No trivial details, minor examples, or random throwaway sentences

**TOPIC DETECTION:**
1. Identify major topics/sections in the document
2. Each topic = one study module with its own flashcards, notes, quizzes
3. Keep topics focused and separate

**FLASHCARD RULES (per topic):**
• One clear concept per card
• Q: Concise, specific question
• A: Accurate, complete answer directly from document
• Avoid: trivial questions, overly broad questions ("Explain everything about..."), minor details
• Example GOOD: Q: "What is the formula for photosynthesis?" A: "6CO2 + 6H2O + light → C6H12O6 + 6O2"
• Example BAD: Q: "What is mentioned on page 5?" or random dates/minor facts

**NOTECARD RULES (per topic):**
• Use headings, bullet points, definitions
• 2-4 clear sentences per note
• Include key takeaways and important examples only
• Remove irrelevant content
• Accurate summaries, no hallucinations

**QUIZ RULES (per topic):**
• Mix types: multiple choice, true/false, short answer
• Every question MUST be directly from the document
• Focus on understanding, not memorization of minor details
• All multiple choice need 4 options with one correct answer
• Avoid questions about trivial info

**QUALITY FILTER:**
If information is not helpful for learning/testing, DO NOT include it. If unclear, summarize core ideas rather than guessing.

**OUTPUT FORMAT:**
{
  "topics": [
    {
      "topic_name": "Clear topic name",
      "flashcards": [{"front": "Clear question", "back": "Accurate answer"}],
      "notecards": [{"topic": "Concept name", "summary": "Concise explanation"}],
      "quizzes": {
        "multiple_choice": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "B) ..."}],
        "true_false": [{"statement": "...", "answer": true}],
        "short_answer": [{"question": "...", "answer": "..."}]
      }
    }
  ]
}

Begin extraction. Use ONLY document content. No invention.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic_name: { type: 'string' },
                  flashcards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        front: { type: 'string' },
                        back: { type: 'string' }
                      }
                    }
                  },
                  notecards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        topic: { type: 'string' },
                        summary: { type: 'string' }
                      }
                    }
                  },
                  quizzes: {
                    type: 'object',
                    properties: {
                      multiple_choice: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            question: { type: 'string' },
                            options: { type: 'array', items: { type: 'string' } },
                            answer: { type: 'string' }
                          }
                        }
                      },
                      true_false: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            statement: { type: 'string' },
                            answer: { type: 'boolean' }
                          }
                        }
                      },
                      short_answer: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            question: { type: 'string' },
                            answer: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Process all topics and create content
      const allFlashcards = [];
      const allNotecards = [];
      const allQuizzes = [];

      response.topics?.forEach(topic => {
        // Create flashcards from this topic
        topic.flashcards?.forEach(fc => {
          const flashcard = {
            question: fc.front,
            answer: fc.back,
            subject,
            masteryLevel: 0,
            sourceId: material.id,
          };
          console.log('Creating flashcard with sourceId:', flashcard.sourceId, 'Material ID:', material.id);
          allFlashcards.push(flashcard);
        });

        // Create notecards from this topic
        topic.notecards?.forEach(nc => {
          allNotecards.push({
            topic: nc.topic,
            summary: nc.summary,
            subject,
            sourceId: material.id,
          });
        });

        // Create quizzes from this topic
        topic.quizzes?.multiple_choice?.forEach(q => {
          allQuizzes.push({
            question: q.question,
            type: 'multiple_choice',
            options: q.options,
            answer: q.answer,
            subject,
            sourceId: material.id,
          });
        });

        topic.quizzes?.true_false?.forEach(q => {
          allQuizzes.push({
            question: q.statement,
            type: 'true_false',
            options: ['True', 'False'],
            answer: q.answer ? 'True' : 'False',
            subject,
            sourceId: material.id,
          });
        });

        topic.quizzes?.short_answer?.forEach(q => {
          allQuizzes.push({
            question: q.question,
            type: 'short_answer',
            answer: q.answer,
            subject,
            sourceId: material.id,
          });
        });
      });

      // Bulk create all content
      console.log('Creating flashcards:', allFlashcards);
      console.log('Material ID:', material.id);
      
      if (allFlashcards.length > 0) {
        await base44.entities.Flashcard.bulkCreate(allFlashcards);
      }

      if (allNotecards.length > 0) {
        await base44.entities.Notecard.bulkCreate(allNotecards);
      }

      if (allQuizzes.length > 0) {
        await base44.entities.Quiz.bulkCreate(allQuizzes);
      }

      // Update material status
      await base44.entities.StudyMaterial.update(material.id, {
        status: 'completed',
        flashcardCount: allFlashcards.length,
        notecardCount: allNotecards.length,
        quizCount: allQuizzes.length,
      });

      return {
        material,
        counts: {
          flashcards: allFlashcards.length,
          notecards: allNotecards.length,
          quizzes: allQuizzes.length,
        }
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['studyMaterials']);
      queryClient.invalidateQueries(['flashcards']);
      toast.success(`Generated ${data.counts.flashcards} flashcards, ${data.counts.notecards} notecards, and ${data.counts.quizzes} quizzes!`);
      setTitle('');
      setFile(null);
      setSubject('other');
    },
    onError: (error) => {
      toast.error('Failed to generate content: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error('Please provide a title and file');
      return;
    }
    generateMutation.mutate({ title, subject, file });
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-6 px-3 pb-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Generate Study Content</h1>
          <p className="text-white/60 text-sm md:text-base">Upload your study material and let AI create flashcards, notes, and quizzes</p>
        </div>

        {/* Upload Form */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Biology Chapter 5"
                className="bg-slate-900 border-slate-700 text-white"
                disabled={generateMutation.isPending}
              />
            </div>

            <div>
              <Label className="text-white">Subject</Label>
              <Select value={subject} onValueChange={setSubject} disabled={generateMutation.isPending}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Upload File</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg p-8 cursor-pointer hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    disabled={generateMutation.isPending}
                  />
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-white">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={generateMutation.isPending || !title || !file}
              className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Study Content
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Materials List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Your Study Materials</h2>
          {materials.length > 0 ? (
            materials.map(material => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <FileText className="w-8 h-8 text-purple-400 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold text-white">{material.title}</h3>
                        <p className="text-slate-400 text-sm capitalize">{material.subject}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-400">📚 {material.flashcardCount} flashcards</span>
                          <span className="text-blue-400">📝 {material.notecardCount} notes</span>
                          <span className="text-yellow-400">❓ {material.quizCount} quizzes</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {material.status === 'completed' && (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      )}
                      {material.status === 'processing' && (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
              <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No materials yet</h3>
              <p className="text-white/60">Upload your first study material to get started</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}