export type DailyFactResponse = {
  fact: string;
  category?: string;
  difficulty?: string;
};

const LOCAL_FACTS: DailyFactResponse[] = [
  {
    fact: "A program is just a precise recipe for a computer to follow.",
    category: "fundamentals",
    difficulty: "beginner",
  },
  {
    fact: "Most bugs come from unclear requirements, not syntax mistakes.",
    category: "engineering",
    difficulty: "intermediate",
  },
  {
    fact: "Abstractions help you manage complexity by hiding details.",
    category: "design",
    difficulty: "intermediate",
  },
  {
    fact: "Reading existing code is one of the fastest ways to learn.",
    category: "learning",
    difficulty: "beginner",
  },
];

export async function generateDailyFact(): Promise<DailyFactResponse> {
  const index = Math.floor(
    (Date.now() / (1000 * 60 * 60 * 24)) % LOCAL_FACTS.length
  );
  return LOCAL_FACTS[index];
}

export type GenerateFlashcardsParams = {
  language: string;
  topic: string;
  difficulty?: string;
  count?: number;
};

export type Flashcard = {
  id?: string;
  question: string;
  answer: string;
  difficulty: string;
  code?: string;
};

export type GenerateFlashcardsResponse = {
  cards: Flashcard[];
};

export async function generateFlashcards(
  params: GenerateFlashcardsParams
): Promise<GenerateFlashcardsResponse> {
  const { language, topic, difficulty = "medium", count = 10 } = params;

  const basePrompt = `${topic}`.trim() || "this topic";
  const safeCount = Math.max(3, Math.min(count, 20));

  const cards: Flashcard[] = Array.from({ length: safeCount }).map(
    (_, index) => ({
      question: `Q${
        index + 1
      }: In ${language}, how does ${basePrompt} apply here?`,
      answer: `A${
        index + 1
      }: This is a practice prompt about ${basePrompt} in ${language}. Use it to recall definitions, write small code snippets, or explain the idea in your own words.`,
      difficulty,
    })
  );

  return { cards };
}
