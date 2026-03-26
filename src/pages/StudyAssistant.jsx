import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, Sparkles, MessageSquare, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Physics', 'Chemistry', 'Biology', 'Coding'];

// Signals we parse from student messages to detect sentiment
const POSITIVE_SIGNALS = ["i get it", "oh!", "that makes sense", "great analogy", "i understand", "perfect", "thanks", "got it", "makes sense", "love that", "helpful"];
const NEGATIVE_SIGNALS = ["still confused", "don't understand", "can't remember", "keep forgetting", "too much", "don't get it", "lost", "not helping", "i'm stuck", "no idea"];

function detectSentiment(text) {
  const lower = text.toLowerCase();
  if (POSITIVE_SIGNALS.some(s => lower.includes(s))) return 'positive';
  if (NEGATIVE_SIGNALS.some(s => lower.includes(s))) return 'negative';
  return 'neutral';
}

export default function StudyAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Math');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPrefs, setLearningPrefs] = useState(null);
  // Track last method used per assistant turn so we can attribute feedback
  const lastMethodRef = useRef(null);

  // Load learning preferences on mount
  useEffect(() => {
    base44.entities.UserProfile.list().then(profiles => {
      if (profiles[0]?.learningPreferences) {
        setLearningPrefs(profiles[0].learningPreferences);
      }
    }).catch(() => {});
  }, []);

  // Handle pre-filled context from quiz or other sources
  useEffect(() => {
    if (location.state?.initialQuestion) {
      const { question, subject: initialSubject } = location.state;
      setSubject(initialSubject || 'Math');
      const questionText = `I need help with this: ${question}`;
      setInput(questionText);
      setTimeout(() => sendMessage(questionText), 100);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update learning preferences after a message based on student sentiment
  const updateLearningPrefs = async (studentMessage, methodUsed) => {
    if (!methodUsed) return;
    const sentiment = detectSentiment(studentMessage);
    if (sentiment === 'neutral') return;

    try {
      const profiles = await base44.entities.UserProfile.list();
      if (!profiles[0]) return;
      const prefs = profiles[0].learningPreferences || {};
      const preferred = prefs.preferredMethods || [];
      const weak = prefs.weakMethods || [];

      if (sentiment === 'positive' && !preferred.includes(methodUsed)) {
        preferred.push(methodUsed);
        const weakIdx = weak.indexOf(methodUsed);
        if (weakIdx > -1) weak.splice(weakIdx, 1);
      } else if (sentiment === 'negative' && !weak.includes(methodUsed)) {
        weak.push(methodUsed);
        const prefIdx = preferred.indexOf(methodUsed);
        if (prefIdx > -1) preferred.splice(prefIdx, 1);
      }

      const updated = {
        ...prefs,
        preferredMethods: preferred,
        weakMethods: weak,
        totalTutorSessions: (prefs.totalTutorSessions || 0) + 1,
        lastUpdated: new Date().toISOString()
      };
      await base44.entities.UserProfile.update(profiles[0].id, { learningPreferences: updated });
      setLearningPrefs(updated);
    } catch (e) {
      // silent fail — preference tracking is background, not critical
    }
  };

  const sendMessage = async (messageText = input, isFollowUp = false) => {
    if (!messageText.trim() || isLoading) return;

    // Attribute feedback from this message to the last method used
    if (lastMethodRef.current) {
      updateLearningPrefs(messageText, lastMethodRef.current);
    }

    const userMessage = { role: 'user', content: messageText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationContext = messages
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const preferredStr = learningPrefs?.preferredMethods?.length
        ? `This student responds well to: ${learningPrefs.preferredMethods.join(', ')}.`
        : '';
      const weakStr = learningPrefs?.weakMethods?.length
        ? `Avoid these for now (haven't worked well): ${learningPrefs.weakMethods.join(', ')}.`
        : '';

      const prompt = `You are an adaptive AI tutor for a high school student studying ${subject}.

## YOUR ADAPTIVE TEACHING PROFILE FOR THIS STUDENT:
${preferredStr || 'No strong preference detected yet — try a mix of methods.'}
${weakStr}

## YOUR TEACHING TOOLKIT (choose the best one for this message):

1. **direct_explanation** — State the concept clearly and directly. Use for: new topics, simple factual questions.
2. **worked_example** — Solve a problem step by step. Use for: math, science, coding problems.
3. **socratic** — Ask 1-2 targeted guiding questions AFTER a brief explanation to check understanding. Use only when student seems close. Never use as a replacement for explaining.
4. **analogy** — Relate to something familiar. Use for: abstract ideas.
5. **dual_coding** — Pair explanation with a text visual: ASCII diagram, table, or structured layout. Use for: processes, comparisons, spatial concepts.
6. **chunking** — Break into small numbered pieces. Use for: complex or overwhelming topics.
7. **mnemonic** — Create a memorable hook or acronym. Use for: when student says they keep forgetting.

## RULES:
- ALWAYS explain first. Never open with questions unless the question is ambiguous.
- Socratic questions come AFTER your explanation, not before, and max 2 in a row.
- Pick ONE primary method per response. Label it internally to track it.
- At the very start of your response, write exactly: [METHOD: <method_name>] on its own line. This will be hidden from the student.
- Be warm, concise, and encouraging.

## FORMATTING:
- **Bold** key terms
- Numbered steps for processes
- \`code style\` for formulas/equations
- Tables or ASCII diagrams for dual coding

${conversationContext ? '## CONVERSATION SO FAR:\n' + conversationContext + '\n' : ''}
## STUDENT MESSAGE:
"${messageText}"

Teach them now:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });

      // Extract and strip the [METHOD: ...] tag
      const methodMatch = response.match(/\[METHOD:\s*(\w+)\]/i);
      const methodUsed = methodMatch ? methodMatch[1].toLowerCase() : null;
      lastMethodRef.current = methodUsed;
      const cleanResponse = response.replace(/\[METHOD:\s*\w+\]\n?/i, '').trim();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanResponse,
        method: methodUsed,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const METHOD_LABELS = {
    direct_explanation: '📖 Direct',
    worked_example: '🔢 Worked Example',
    socratic: '🤔 Guided Questions',
    analogy: '🌉 Analogy',
    dual_coding: '🗺️ Visual',
    chunking: '🧩 Chunked',
    mnemonic: '💡 Memory Trick',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Study Assistant
            </h1>
            <p className="text-white/60 text-sm flex items-center gap-1">
              {learningPrefs?.preferredMethods?.length ? (
                <><Brain className="w-3 h-3 text-purple-400" /> Adapted to your style</>
              ) : (
                location.state?.topic ? `Topic: ${location.state.topic}` : 'Adaptive AI tutor'
              )}
            </p>
          </div>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-20">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Hi! I'm your adaptive tutor</h2>
              <p className="text-white/60 mb-2">I'll learn how you learn and teach in the way that works best for you.</p>
              {learningPrefs?.preferredMethods?.length > 0 && (
                <p className="text-purple-400 text-sm mb-4">
                  ✨ Your style: {learningPrefs.preferredMethods.join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto mt-4">
                {['How do I solve quadratic equations?', 'Explain photosynthesis simply', 'What caused World War II?', 'Help me understand functions'].map((suggestion, idx) => (
                  <button key={idx} onClick={() => setInput(suggestion)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all">
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white border border-white/10'}`}>
                {message.role === 'assistant' && message.method && (
                  <div className="text-xs text-purple-400/70 mb-2 font-medium">
                    {METHOD_LABELS[message.method] || message.method}
                  </div>
                )}
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="text-purple-300 font-semibold">{children}</strong>,
                      code: ({ inline, children }) => inline
                        ? <code className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 text-sm font-mono">{children}</code>
                        : <code className="block px-3 py-2 rounded-lg bg-slate-900 text-purple-200 text-sm font-mono my-2">{children}</code>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      table: ({ children }) => <table className="w-full text-sm border-collapse my-3">{children}</table>,
                      th: ({ children }) => <th className="border border-white/20 px-3 py-1 bg-white/10 text-left">{children}</th>,
                      td: ({ children }) => <td className="border border-white/10 px-3 py-1">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="leading-relaxed">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </motion.div>
        )}

        {messages.length > 0 && !isLoading && messages[messages.length - 1].role === 'assistant' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 flex-wrap">
            {[
              { label: 'Show another example', msg: 'Can you show me another example?' },
              { label: 'Use an analogy', msg: 'Can you explain that with an analogy?' },
              { label: 'Draw it out', msg: 'Can you show me a visual or diagram?' },
              { label: "I'm still confused", msg: "I'm still confused, can you try a different way?" },
            ].map(({ label, msg }) => (
              <button key={label} onClick={() => sendMessage(msg)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all">
                {label}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10 glass">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your homework..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} className="bg-purple-600 hover:bg-purple-700 px-6">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}