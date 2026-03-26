import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Physics', 'Chemistry', 'Biology', 'Coding'];

export default function StudyAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Math');
  const [isLoading, setIsLoading] = useState(false);

  // Handle pre-filled context from quiz or other sources
  useEffect(() => {
    if (location.state?.initialQuestion) {
      const { question, subject: initialSubject, topic } = location.state;
      setSubject(initialSubject || 'Math');
      // Auto-send the question immediately
      const questionText = `I need help with this problem: ${question}${topic ? ` (Topic: ${topic})` : ''}`;
      setInput(questionText);
      // Send automatically after a brief delay
      setTimeout(() => {
        sendMessage(questionText);
      }, 100);
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText = input, isFollowUp = false) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Detect if student is really struggling and needs creative learning aids
      const isStrugglingSignals = [
        "don't understand", "still confused", "can't remember", "keep forgetting",
        "too much", "too hard", "don't get it", "lost", "help me remember"
      ];
      const isStruggling = isStrugglingSignals.some(signal => 
        messageText.toLowerCase().includes(signal)
      );

      // Check conversation history for repeated confusion
      const recentMessages = messages.slice(-4);
      const hasRepeatedConfusion = recentMessages.filter(m => 
        m.role === 'user' && isStrugglingSignals.some(s => m.content.toLowerCase().includes(s))
      ).length >= 2;

      // Build context from conversation history
      const conversationContext = messages
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const prompt = `You are a direct, clear AI tutor for high school students studying ${subject}. Your job is to explain concepts clearly and helpfully — like a knowledgeable friend who gets straight to the point.

YOUR APPROACH:

DEFAULT: Explain clearly and directly.
- When a student asks a question, give a clear explanation right away.
- Break concepts down into simple, digestible steps.
- Use examples, analogies, and worked problems to make it concrete.
- Do not make them guess or fish for the answer with leading questions — just explain it.

WHEN TO ASK A QUESTION:
- Only ask a question if you genuinely need more info (e.g. at the very start of a vague question: "What part are you stuck on?").
- Never ask multiple questions in a row.
- If they seem confused after an explanation, re-explain it differently — don't quiz them.

STRUCTURE FOR EXPLANATIONS:
1. Give the core concept or answer directly
2. Explain the reasoning or logic behind it
3. Walk through a worked example step by step
4. Offer to do another example or answer follow-up questions

FORMATTING:
- **Bold** for key terms and concepts
- Numbered lists for sequential steps
- code style for formulas and equations
- Short, scannable paragraphs
- Friendly, encouraging tone

${conversationContext ? 'CONVERSATION HISTORY:\n' + conversationContext + '\n\n' : ''}

STUDENT'S MESSAGE:
"${messageText}"

Respond as their helpful tutor:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      let finalResponse = response;

      // If student is really struggling, generate a creative learning aid
      if (isStruggling || hasRepeatedConfusion) {
        try {
          // Extract the main topic/concept from the conversation
          const topicExtractionPrompt = `Based on this conversation, identify the MAIN concept or topic the student is struggling with in 1-2 sentences:

${conversationContext}

Current question: ${messageText}

Just state the topic/concept clearly.`;

          const topicResponse = await base44.integrations.Core.InvokeLLM({
            prompt: topicExtractionPrompt,
            add_context_from_internet: false,
          });

          // Generate learning aid using the agent
          const learningAidPrompt = `Create a creative memory aid for this concept:

${topicResponse}

Subject: ${subject}
Student Context: ${conversationContext ? conversationContext.slice(-500) : 'Student is struggling to understand this concept'}

Generate an engaging mnemonic, analogy, or memory technique to help them remember and understand this.`;

          const learningAid = await base44.integrations.Core.InvokeLLM({
            prompt: learningAidPrompt,
            add_context_from_internet: false,
          });

          // Combine the tutor response with the creative learning aid
          finalResponse = `${response}\n\n---\n\n💡 **Let me give you a memory trick that might help!**\n\n${learningAid}`;
        } catch (error) {
          console.error('Failed to generate learning aid:', error);
          // Continue without learning aid if it fails
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      console.error('AI error:', error);
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

  const suggestFollowUp = (suggestion) => {
    sendMessage(suggestion, true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Study Assistant
            </h1>
            <p className="text-white/60 text-sm">
              {location.state?.topic ? `Topic: ${location.state.topic}` : 'Your AI tutor'}
            </p>
          </div>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-20"
            >
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Hi! I'm your study assistant</h2>
              <p className="text-white/60 mb-6">Ask me anything about {subject}. I'll help break it down step-by-step!</p>
              
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {[
                  'How do I solve quadratic equations?',
                  'Explain photosynthesis simply',
                  'What caused World War II?',
                  'Help me understand functions',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white border border-white/10'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="text-purple-300 font-semibold">{children}</strong>,
                      code: ({ inline, children }) => 
                        inline ? (
                          <code className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className="block px-3 py-2 rounded-lg bg-slate-900 text-purple-200 text-sm font-mono my-2">
                            {children}
                          </code>
                        ),
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-white/60"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </motion.div>
        )}

        {messages.length > 0 && !isLoading && messages[messages.length - 1].role === 'assistant' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 flex-wrap"
          >
            <button
              onClick={() => suggestFollowUp('Can you explain that differently?')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all"
            >
              Explain differently
            </button>
            <button
              onClick={() => suggestFollowUp('Can you show another example?')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all"
            >
              Show another example
            </button>
            <button
              onClick={() => suggestFollowUp("I'm still confused")}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all"
            >
              I'm still confused
            </button>
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
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}