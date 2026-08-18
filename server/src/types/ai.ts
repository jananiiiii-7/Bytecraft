export type Difficulty = "beginner" | "easy" | "medium" | "hard";

export interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  code?: string;
  explanation?: string;
}

export interface FlashcardGenerationRequest {
  language: string;
  topic: string;
  difficulty?: Difficulty;
  count?: number;
  userId?: string;
}

export interface FlashcardGenerationResponse {
  cards: Flashcard[];
  source: "gemini" | "fallback";
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface QuizGenerationRequest {
  language: string;
  topic: string;
  difficulty?: Difficulty;
  count?: number;
}

export interface QuizGenerationResponse {
  title: string;
  questions: QuizQuestion[];
  source: "gemini" | "fallback";
}

export interface ConceptExplanationRequest {
  topic: string;
  language: string;
  level?: "beginner" | "intermediate" | "advanced";
}

export interface ConceptExplanationResponse {
  title: string;
  summary: string;
  keyPoints: string[];
  example: string;
  source: "gemini" | "fallback";
}

export interface RoadmapGenerationRequest {
  topic: string;
  language: string;
  goal?: string;
  level?: "beginner" | "intermediate" | "advanced";
}

export interface RoadmapStep {
  title: string;
  description: string;
  estimatedDuration: string;
}

export interface RoadmapGenerationResponse {
  title: string;
  goal: string;
  steps: RoadmapStep[];
  source: "gemini" | "fallback";
}

export interface DailyFactRequest {
  language?: string;
  category?: string;
}

export interface DailyFactResponse {
  text: string;
  category: string;
  difficulty: Difficulty;
  source: "gemini" | "fallback";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatCompletionRequest {
  userId: string;
  sessionId?: string;
  message: string;
  language?: string;
  context?: string[];
}

export interface ChatCompletionResponse {
  sessionId: string;
  reply: string;
  messages: ChatMessage[];
  source: "gemini" | "fallback";
}

export interface InterviewQuestion {
  id: string;
  topic: string;
  question: string;
  difficulty: Difficulty;
  hint?: string;
  expectedAnswer?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  topic: string;
  difficulty: Difficulty;
  questions: InterviewQuestion[];
  createdAt: string;
}

export interface InterviewQuestionRequest {
  userId: string;
  topic: string;
  difficulty?: Difficulty;
}

export interface InterviewAnswerRequest {
  sessionId: string;
  userId: string;
  answer: string;
}
