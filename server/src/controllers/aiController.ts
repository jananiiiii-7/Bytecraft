import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AppError } from "../types/http";
import { GeminiService } from "../services/geminiService";
import { CacheService } from "../services/cacheService";
import { env } from "../utils/env";
import {
  flashcardGenerationResponseSchema,
  flashcardGenerationSchema,
  quizGenerationSchema,
  conceptExplanationSchema,
  roadmapGenerationSchema,
  dailyFactSchema,
  chatCompletionSchema,
  interviewQuestionSchema,
  interviewAnswerSchema,
} from "../utils/validation";

export class AiController {
  private readonly supabase =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      : null;

  constructor(
    private readonly geminiService = new GeminiService(),
    private readonly cacheService = new CacheService(),
  ) {}

  generateFlashcards = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = flashcardGenerationSchema.parse(req.body);
      const cacheKey = `flashcards:${parsed.userId ?? "anonymous"}:${parsed.language}:${parsed.topic}:${parsed.difficulty ?? "medium"}:${parsed.count ?? 10}`;
      const cached = this.cacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const existing = await this.findCachedFlashcards(parsed);
      if (existing && existing.length > 0) {
        const payload = { cards: existing, source: "cache" as const };
        this.cacheService.set(cacheKey, payload);
        const validated = flashcardGenerationResponseSchema.parse(payload);
        return res.json(validated);
      }

      const result = await this.geminiService.generateFlashcards(parsed);
      const validated = flashcardGenerationResponseSchema.parse(result);
      await this.storeFlashcards(parsed, validated.cards);
      this.cacheService.set(cacheKey, validated);
      return res.json(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError("Invalid request payload", 400));
      }
      next(error);
    }
  };

  private async findCachedFlashcards(
    parsed: z.infer<typeof flashcardGenerationSchema>,
  ) {
    if (!this.supabase || !parsed.userId) {
      return null;
    }

    const languageId = await this.resolveLanguageId(parsed.language);
    if (!languageId) {
      return null;
    }

    const { data } = await this.supabase
      .from("flashcards")
      .select("question, answer, difficulty")
      .eq("user_id", parsed.userId)
      .eq("language_id", languageId)
      .eq("topic", parsed.topic)
      .eq("difficulty", parsed.difficulty ?? "medium")
      .order("id");

    return (data ?? []).map((row) => ({
      question: row.question,
      answer: row.answer,
      difficulty:
        (row.difficulty as "beginner" | "easy" | "medium" | "hard") ??
        parsed.difficulty ??
        "medium",
    }));
  }

  private async resolveLanguageId(
    languageName: string,
  ): Promise<string | null> {
    if (!this.supabase) {
      return null;
    }

    const { data: byName } = await this.supabase
      .from("languages")
      .select("id")
      .eq("name", languageName)
      .maybeSingle();

    if (byName?.id) {
      return byName.id as string;
    }

    const { data: bySlug } = await this.supabase
      .from("languages")
      .select("id")
      .eq("slug", languageName.toLowerCase())
      .maybeSingle();

    return (bySlug?.id as string) ?? null;
  }

  private async storeFlashcards(
    parsed: z.infer<typeof flashcardGenerationSchema>,
    cards: Array<{
      question: string;
      answer: string;
      difficulty?: string;
      id?: string;
    }>,
  ) {
    if (!this.supabase || !parsed.userId) {
      return;
    }

    const languageId = await this.resolveLanguageId(parsed.language);
    if (!languageId) {
      return;
    }

    for (const card of cards) {
      await this.supabase.from("flashcards").insert({
        user_id: parsed.userId,
        language_id: languageId,
        topic: parsed.topic,
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty ?? parsed.difficulty ?? "medium",
      });
    }
  }

  generateQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = quizGenerationSchema.parse(req.body);
      const result = await this.geminiService.generateQuiz(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  explainConcept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = conceptExplanationSchema.parse(req.body);
      const result = await this.geminiService.explainConcept(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  generateRoadmap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = roadmapGenerationSchema.parse(req.body);
      const result = await this.geminiService.generateRoadmap(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  generateDailyFact = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = dailyFactSchema.parse(req.body);
      const result = await this.geminiService.generateDailyFact(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = chatCompletionSchema.parse(req.body);
      const result = await this.geminiService.chat(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  generateInterviewQuestions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = interviewQuestionSchema.parse(req.body);
      const result =
        await this.geminiService.generateInterviewQuestions(parsed);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  };

  submitInterviewAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = interviewAnswerSchema.parse(req.body);
      return res.json({
        ok: true,
        sessionId: parsed.sessionId,
        received: parsed.answer,
      });
    } catch (error) {
      next(error);
    }
  };
}
