import fs from "fs";
import path from "path";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ConceptExplanationRequest,
  ConceptExplanationResponse,
  DailyFactRequest,
  DailyFactResponse,
  FlashcardGenerationRequest,
  FlashcardGenerationResponse,
  InterviewQuestionRequest,
  InterviewQuestion,
  QuizGenerationRequest,
  QuizGenerationResponse,
  RoadmapGenerationRequest,
  RoadmapGenerationResponse,
} from "../types/ai";
import { AppError } from "../types/http";
import { env } from "../utils/env";
import { flashcardGenerationResponseSchema } from "../utils/validation";

export class GeminiService {
  private getPromptTemplate(): string {
    const promptPath = path.resolve(process.cwd(), "src/prompts/flashcards.txt");
    return fs.readFileSync(promptPath, "utf8");
  }

  private buildPrompt(req: FlashcardGenerationRequest): string {
    const template = this.getPromptTemplate();
    return template
      .replace("{language}", req.language)
      .replace("{topic}", req.topic)
      .replace("{difficulty}", req.difficulty ?? "medium")
      .replace("{count}", String(req.count ?? 10));
  }

  private async requestGemini(req: FlashcardGenerationRequest): Promise<FlashcardGenerationResponse> {
    if (!env.GEMINI_API_KEY) {
      return this.buildFallbackFlashcards(req);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.buildPrompt(req) }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new AppError("Gemini request failed", 502);
    }

    const payload = await response.json();
    const text =
      payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text).join("\n") ?? "";

    if (!text) {
      throw new AppError("Gemini response was empty", 502);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { cards: [] };
    }

    const parsedCards = Array.isArray((parsed as { cards?: unknown }).cards)
      ? (parsed as { cards: FlashcardGenerationResponse["cards"] }).cards
      : [];

    const cards = parsedCards.map((card) => ({
      ...card,
      difficulty: card.difficulty ?? (req.difficulty ?? "medium"),
    })) as FlashcardGenerationResponse["cards"];

    const validated = flashcardGenerationResponseSchema.parse({
      cards,
      source: "gemini",
    });

    return validated as FlashcardGenerationResponse;
  }

  private buildFallbackFlashcards(
    req: FlashcardGenerationRequest,
  ): FlashcardGenerationResponse {
    const count = req.count ?? 3;
    const topicLabel = req.topic.toLowerCase();
    const cards = Array.from({ length: count }, (_, index) => ({
      question: `What is the role of ${topicLabel} in ${req.language}?`,
      answer: `A ${topicLabel} concept helps structure and organize code in ${req.language}.`,
      difficulty: req.difficulty ?? "beginner",
      explanation: `This flashcard introduces a core idea around ${topicLabel}.`,
      id: `flashcard-${index + 1}`,
    }));

    return { cards, source: "fallback" };
  }

  private buildFallbackQuiz(
    req: QuizGenerationRequest,
  ): QuizGenerationResponse {
    const count = req.count ?? 3;
    const questions = Array.from({ length: count }, (_, index) => ({
      id: `q-${index + 1}`,
      prompt: `Which statement best describes ${req.topic} in ${req.language}?`,
      options: [
        "It provides a reusable structure for the concept.",
        "It only works at runtime.",
        "It is unrelated to learning.",
      ],
      answer: "It provides a reusable structure for the concept.",
      explanation: `This question focuses on the core idea behind ${req.topic}.`,
    }));

    return { title: `${req.topic} practice`, questions, source: "fallback" };
  }

  private buildFallbackConcept(
    req: ConceptExplanationRequest,
  ): ConceptExplanationResponse {
    return {
      title: `Understanding ${req.topic}`,
      summary: `A concise explanation of ${req.topic} for ${req.language}.`,
      keyPoints: [
        "Start with the core idea.",
        "Connect it to an example in code.",
        "Practice by applying it in small problems.",
      ],
      example: `Example for ${req.topic} in ${req.language}`,
      source: "fallback",
    };
  }

  private buildFallbackRoadmap(
    req: RoadmapGenerationRequest,
  ): RoadmapGenerationResponse {
    return {
      title: `${req.topic} roadmap`,
      goal: req.goal ?? `Become comfortable with ${req.topic}`,
      steps: [
        {
          title: "Learn the fundamentals",
          description: "Understand the core building blocks of the topic.",
          estimatedDuration: "1-2 days",
        },
        {
          title: "Practice with small examples",
          description: "Apply the concept in minimal, hands-on exercises.",
          estimatedDuration: "2-3 days",
        },
        {
          title: "Build a small project",
          description: "Use the topic in a practical implementation.",
          estimatedDuration: "3-5 days",
        },
      ],
      source: "fallback",
    };
  }

  private buildFallbackDailyFact(req: DailyFactRequest): DailyFactResponse {
    const language = req.language ?? "programming";
    const category = req.category ?? "concept";
    return {
      text: `${language} learners benefit from practicing one small concept each day in ${category}.`,
      category,
      difficulty: "beginner",
      source: "fallback",
    };
  }

  private buildFallbackChat(
    req: ChatCompletionRequest,
  ): ChatCompletionResponse {
    const sessionId = req.sessionId ?? `session-${Date.now()}`;
    return {
      sessionId,
      reply: `I can help you study ${req.language ?? "programming"} with focused guidance on ${req.message}.`,
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: `I can help you study ${req.language ?? "programming"} with focused guidance on ${req.message}.`,
          createdAt: new Date().toISOString(),
        },
      ],
      source: "fallback",
    };
  }

  private buildFallbackInterviewQuestions(req: InterviewQuestionRequest): {
    questions: InterviewQuestion[];
  } {
    return {
      questions: [
        {
          id: "q1",
          topic: req.topic,
          question: `Explain how you would approach ${req.topic} in a real project.`,
          difficulty: req.difficulty ?? "medium",
          hint: "Describe the trade-offs and your reasoning.",
          expectedAnswer:
            "Focus on clarity, structure, and practical implementation.",
        },
      ],
    };
  }

  async generateFlashcards(
    req: FlashcardGenerationRequest,
  ): Promise<FlashcardGenerationResponse> {
    try {
      return await this.requestGemini(req);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      return this.buildFallbackFlashcards(req);
    }
  }

  async generateQuiz(
    req: QuizGenerationRequest,
  ): Promise<QuizGenerationResponse> {
    return this.buildFallbackQuiz(req);
  }

  async explainConcept(
    req: ConceptExplanationRequest,
  ): Promise<ConceptExplanationResponse> {
    return this.buildFallbackConcept(req);
  }

  async generateRoadmap(
    req: RoadmapGenerationRequest,
  ): Promise<RoadmapGenerationResponse> {
    return this.buildFallbackRoadmap(req);
  }

  async generateDailyFact(req: DailyFactRequest): Promise<DailyFactResponse> {
    return this.buildFallbackDailyFact(req);
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.buildFallbackChat(req);
  }

  async generateInterviewQuestions(
    req: InterviewQuestionRequest,
  ): Promise<{ questions: InterviewQuestion[] }> {
    return this.buildFallbackInterviewQuestions(req);
  }
}
