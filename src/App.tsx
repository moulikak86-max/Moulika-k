/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  BookOpen, 
  Sparkles,
  History,
  Settings,
  Languages,
  Trophy,
  ChevronRight,
  Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { Language, Message, QuizQuestion, UserProgress } from './types';
import { geminiService } from './services/geminiService';
import { useVoice } from './hooks/useVoice';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', nameLocal: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nameLocal: 'हिन्दी', flag: '🇮🇳' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState<UserProgress>({
    completedConcepts: [],
    learningHistory: [],
  });
  const [activeQuiz, setActiveQuiz] = useState<{ questions: QuizQuestion[], messageId: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, isSpeaking, speak, stopSpeaking } = useVoice();

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text?: string) => {
    const textToSend = typeof text === 'string' ? text : inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      type: 'text',
      language: currentLanguage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const history = messages.filter(m => m.role === 'assistant').map(m => m.content).slice(-3);
      const { explanation, nextConcept } = await geminiService.generateExplanation(textToSend, currentLanguage, history);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: explanation,
        type: 'story',
        language: currentLanguage,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-voice if enabled (optional, let's keep it manual for now to avoid annoyance)
      
      // After explanation, wait a bit then offer quiz
      setTimeout(async () => {
        const quiz = await geminiService.generateQuiz(textToSend, explanation, currentLanguage);
        const quizMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: currentLanguage === 'en' ? "Ready for a quick quiz?" : 
                   currentLanguage === 'te' ? "చిన్న క్విజ్ కోసం సిద్ధంగా ఉన్నారా?" : 
                   "एक छोटी प्रश्नोत्तरी के लिए तैयार हैं?",
          type: 'quiz',
          language: currentLanguage,
          quiz,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, quizMessage]);
      }, 2000);

    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22c55e', '#16a34a']
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFCF9] text-[#2D2D2D] font-sans overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E5E1DA] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F27D26] flex items-center justify-center shadow-lg shadow-orange-100">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">EduStory</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Personal Tutor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-[#F3F2EE] p-1 rounded-lg gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setCurrentLanguage(lang.code as Language)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                  currentLanguage === lang.code 
                    ? "bg-white text-[#F27D26] shadow-sm" 
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <History className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 max-w-3xl mx-auto w-full space-y-8 scroll-smooth pb-32">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-6"
          >
            <div className="bg-[#FFF8F3] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#FFE9D9]">
              <Sparkles className="w-10 h-10 text-[#F27D26]" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight px-4 text-balance">
              What concept would you like to explore today?
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm px-6">
              I'll tell you a story to help you understand anything from black holes to biology.
            </p>
            <div className="flex flex-wrap justify-center gap-3 px-4">
              {["Photosynthesis", "The Internet", "How Money Works", "Quantum Physics"].map(topic => (
                <button
                  key={topic}
                  onClick={() => handleSendMessage(topic)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium hover:border-[#F27D26] hover:text-[#F27D26] transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode='popLayout'>
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onQuizAnswer={handleQuizAnswer} 
              onSpeak={() => speak(msg.content, msg.language)}
              isSpeaking={isSpeaking}
            />
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#FFF8F3] p-4 rounded-2xl border border-[#FFE9D9] flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Section */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFCF9] via-[#FDFCF9] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 flex items-center gap-2 pr-4 pl-3">
            <button 
              onClick={() => startListening(currentLanguage === 'te' ? 'te-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-US')}
              className={cn(
                "p-3 rounded-2xl transition-all relative overflow-hidden",
                isListening ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 animate-pulse" />
                  <motion.div 
                    layoutId="listening-wave"
                    className="absolute inset-0 bg-red-400/10"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </>
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 py-4 text-base focus:outline-none placeholder:text-gray-400 font-medium"
            />

            <button
               onClick={() => handleSendMessage()}
               disabled={!inputText.trim() || isTyping}
               className={cn(
                "p-3 rounded-2xl transition-all",
                inputText.trim() ? "bg-[#F27D26] text-white shadow-lg shadow-orange-200 scale-100" : "bg-gray-100 text-gray-300 scale-95 opacity-50"
               )}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          
          <p className="text-[10px] text-center mt-3 text-gray-400 uppercase tracking-widest font-bold">
            Powered by Gemini AI • Multilingual Education
          </p>
        </div>
      </div>
      
      {/* Mobile Language FAB */}
      <div className="sm:hidden fixed bottom-24 right-4 flex flex-col gap-2">
        <motion.div className="flex flex-col gap-2">
             {LANGUAGES.map((lang, i) => (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={lang.code}
                  onClick={() => setCurrentLanguage(lang.code as Language)}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl border-2",
                    currentLanguage === lang.code ? "bg-white border-[#F27D26]" : "bg-white border-transparent"
                  )}
                >
                  {lang.flag}
                </motion.button>
             ))}
        </motion.div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  onQuizAnswer, 
  onSpeak,
  isSpeaking 
}: { 
  message: Message, 
  onQuizAnswer: (correct: boolean) => void,
  onSpeak: () => void,
  isSpeaking: boolean
}) {
  const isAssistant = message.role === 'assistant';
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  const handleAnswer = (choiceIndex: number) => {
    if (answeredIndex !== null) return;
    setAnsweredIndex(choiceIndex);
    const correct = choiceIndex === (message.quiz?.[currentQuizIndex].correctAnswer ?? 0);
    onQuizAnswer(correct);
    
    if (correct && message.quiz && currentQuizIndex < message.quiz.length - 1) {
       setTimeout(() => {
         setCurrentQuizIndex(prev => prev + 1);
         setAnsweredIndex(null);
       }, 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full group",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 shadow-sm relative",
        isAssistant 
          ? "bg-white border border-[#E5E1DA] rounded-tl-none" 
          : "bg-[#F27D26] text-white rounded-tr-none shadow-orange-100"
      )}>
        {isAssistant && (
          <div className="flex items-center justify-between mb-3">
             <span className="text-[10px] font-black uppercase tracking-tighter text-[#F27D26] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Assistant
             </span>
             <button 
               onClick={onSpeak}
               className={cn(
                 "p-1.5 rounded-lg transition-colors",
                 isSpeaking ? "bg-orange-100 text-orange-600 animate-pulse" : "hover:bg-gray-100 text-gray-400"
               )}
             >
               {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
             </button>
          </div>
        )}

        <div className={cn(
          "prose prose-sm font-medium leading-relaxed",
          !isAssistant && "text-white prose-invert"
        )}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Quiz Rendering */}
        {message.type === 'quiz' && message.quiz && (
          <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
               <Trophy className="w-4 h-4 text-yellow-500" />
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Question {currentQuizIndex + 1} of {message.quiz.length}</span>
            </div>
            
            <p className="font-bold text-gray-800 text-base">{message.quiz[currentQuizIndex].question}</p>
            
            <div className="grid grid-cols-1 gap-2">
              {message.quiz[currentQuizIndex].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answeredIndex !== null}
                  className={cn(
                    "text-left p-4 rounded-xl border text-sm font-semibold transition-all",
                    answeredIndex === null 
                      ? "border-gray-200 hover:border-[#F27D26] hover:bg-orange-50 bg-gray-50/50" 
                      : idx === message.quiz![currentQuizIndex].correctAnswer 
                        ? "bg-green-100 border-green-500 text-green-700"
                        : answeredIndex === idx 
                          ? "bg-red-100 border-red-500 text-red-700" 
                          : "opacity-40 border-gray-100"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {answeredIndex !== null && idx === message.quiz![currentQuizIndex].correctAnswer && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {answeredIndex !== null && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 italic mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                {message.quiz[currentQuizIndex].explanation}
              </motion.p>
            )}
          </div>
        )}
        
        <span className={cn(
          "text-[9px] mt-2 block opacity-40 font-bold",
          !isAssistant && "text-right"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
