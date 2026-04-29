export type Language = 'en' | 'te' | 'hi';

export interface Concept {
  id: string;
  name: string;
  explanation: string;
  storyImageUrl?: string;
  bridgeToNext?: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'story' | 'quiz' | 'bridge';
  language: Language;
  quiz?: QuizQuestion[];
  timestamp: number;
}

export interface UserProgress {
  completedConcepts: string[];
  currentInterest?: string;
  learningHistory: string[];
}
