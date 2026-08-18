import { z } from "zod";

export const flashcardGenerationSchema = z.object({
  language: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["beginner", "easy", "medium", "hard"]).optional(),
  count: z.number().int().min(1).max(20).optional(),
  userId: z.string().min(1).optional(),
});

export const flashcardGenerationResponseSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string().optional(),
      question: z.string().min(1),
      answer: z.string().min(1),
      difficulty: z.enum(["beginner", "easy", "medium", "hard"]).optional(),
      code: z.string().optional(),
      explanation: z.string().optional(),
    }),
  ),
  source: z.enum(["gemini", "fallback", "cache"]).optional(),
});

export const quizGenerationSchema = z.object({
  language: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["beginner", "easy", "medium", "hard"]).optional(),
  count: z.number().int().min(1).max(10).optional(),
});

export const conceptExplanationSchema = z.object({
  topic: z.string().min(1),
  language: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const roadmapGenerationSchema = z.object({
  topic: z.string().min(1),
  language: z.string().min(1),
  goal: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const dailyFactSchema = z.object({
  language: z.string().optional(),
  category: z.string().optional(),
});

export const chatCompletionSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().optional(),
  message: z.string().min(1),
  language: z.string().optional(),
  context: z.array(z.string()).optional(),
});

export const interviewQuestionSchema = z.object({
  userId: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["beginner", "easy", "medium", "hard"]).optional(),
});

export const interviewAnswerSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  answer: z.string().min(1),
});
