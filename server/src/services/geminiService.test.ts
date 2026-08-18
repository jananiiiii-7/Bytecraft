import test from "node:test";
import assert from "node:assert/strict";
import { GeminiService } from "./geminiService";

test("generateFlashcards returns fallback cards when Gemini is not configured", async () => {
  const service = new GeminiService();
  const result = await service.generateFlashcards({
    language: "TypeScript",
    topic: "arrays",
    difficulty: "beginner",
    count: 2,
  });

  assert.equal(result.source, "fallback");
  assert.equal(result.cards.length, 2);
  assert.ok(result.cards[0].question.includes("array"));
});
