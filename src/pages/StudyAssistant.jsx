import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
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
      // Build context from conversation history
      const conversationContext = messages
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const prompt = `You are a hybrid Socratic + Step-by-Step AI tutor for high school students studying ${subject}. You combine the best of both worlds: asking guiding questions like Socrates, then providing clear explanations when needed.

🎯 YOUR TEACHING FLOW:

**STAGE 1: CLARIFY & DIAGNOSE** (First response or new topics)
• Ask only 1 focused question to understand what they know and where they're stuck
• Examples: "What part feels confusing?", "How would you describe this problem in your own words?"
• Goal: Understand their mental model without overwhelming them

**STAGE 2: GUIDED REASONING** (Socratic Mode - Default)
• Ask targeted questions that move them forward step-by-step
• "What do you think the next step might be?", "What pattern do you notice?"
• Validate partial understanding: "Yes, that's a good start!", "You're close—let's refine that"
• Celebrate effort: "Nice thinking there!", "Great job sticking with it!"
• Stay in this mode as long as they're engaging and making progress

**STAGE 3: STEP-BY-STEP MODE** (When needed)
Switch to full explanation mode when student:
• Says "I don't get it at all", "Just show me", "I'm lost", "I'm stuck"
• Gives multiple incorrect attempts
• Explicitly asks for the solution

Then provide:
1. Restate problem in simple terms
2. Explain the concept behind it
3. Walk through each step with reasoning
4. Show a worked example
5. End with check question: "Does this make sense?", "Want to try a similar one?"

🎨 FORMATTING:
• **Bold** for key terms and concepts
• Numbered lists for sequential steps
• \`code style\` for formulas and equations
• Short, scannable paragraphs
• Conversational, friendly tone

🚨 SAFETY & ETHICS:
• Focus on teaching methods, not just final answers
• For test/exam questions, teach the approach
• Stay on educational topics only
• No harmful or inappropriate content

${conversationContext ? `📚 CONVERSATION HISTORY:\n${conversationContext}\n\n` : ''}

💬 STUDENT'S MESSAGE:
"${messageText}"

Respond as their coach and tutor:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response,
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
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