import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { recordUserActivity } from "@/lib/gameActions";
import type { Flashcard } from "@/lib/learningContent";
import { reportAchievementUnlocks } from "@/contexts/NewUnlocksContext";
import { FlashcardView } from "@/components/os/FlashcardView";

export type FlashcardsWindowProps = {
  language: string;
  topic: string;
  difficulty?: string;
};

export function FlashcardsWindow({
  language,
  topic,
  difficulty = "medium",
}: FlashcardsWindowProps) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            topic,
            difficulty: difficulty || "medium",
            count: 10,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load flashcards");
        }

        const payload = (await response.json()) as { cards?: Flashcard[] };
        if (!cancelled) {
          setCards(Array.isArray(payload.cards) ? payload.cards : []);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, language, topic, difficulty]);

  // Got it → recordUserActivity("flashcard_correct"); Revise later → recordUserActivity("flashcard_wrong").
  const handleMark = useCallback(
    async (_cardId: string, status: "mastered" | "needs_revision") => {
      if (!user) {
        return;
      }

      try {
        const r = await recordUserActivity(
          status === "mastered" ? "flashcard_correct" : "flashcard_wrong",
        );
        if (r.newUnlocks?.length) reportAchievementUnlocks(r.newUnlocks);
      } catch {
        // ignore
      }
    },
    [user],
  );

  const handleTopicComplete = useCallback(() => {
    recordUserActivity("topic_complete")
      .then((r) => {
        if (r.newUnlocks?.length) reportAchievementUnlocks(r.newUnlocks);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Loading flashcards…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm">
        <p className="text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground">
          Check your connection and authentication.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-mono">
        {language} · {topic}
      </p>
      <FlashcardView
        cards={cards}
        onMark={user ? handleMark : undefined}
        onTopicComplete={handleTopicComplete}
      />
    </div>
  );
}
