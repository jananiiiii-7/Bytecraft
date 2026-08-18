import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Flashcard } from "@/lib/learningContent";

type FlashcardViewProps = {
  cards: Flashcard[];
  onMark?: (cardId: string, status: "mastered" | "needs_revision") => void;
  /** Called when user marks the last card in the deck (topic session complete). */
  onTopicComplete?: () => void;
  /** Optional: hook for flip sound (e.g. () => playFlip()). Not used by default. */
  onFlipSound?: () => void;
  /** Optional: hook for "got it" sound. */
  onMarkCorrectSound?: () => void;
  /** Optional: hook for "revise later" sound. */
  onMarkReviseSound?: () => void;
};

export function FlashcardView({
  cards,
  onMark,
  onTopicComplete,
  onFlipSound,
  onMarkCorrectSound,
  onMarkReviseSound,
}: FlashcardViewProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [localCorrect, setLocalCorrect] = useState(0);
  const [localRevise, setLocalRevise] = useState(0);

  const card = cards[index];
  const cardId = card?.id ?? `card-${index}`;
  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;

  const flip = useCallback(() => {
    setRevealed((r) => !r);
    onFlipSound?.();
  }, [onFlipSound]);

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    setIndex((i) => i - 1);
    setRevealed(false);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setIndex((i) => i + 1);
    setRevealed(false);
  }, [hasNext]);

  const markRevise = useCallback(() => {
    onMark?.(cardId, "needs_revision");
    onMarkReviseSound?.();
    setLocalRevise((c) => c + 1);
    if (!hasNext) onTopicComplete?.();
    if (hasNext) {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }, [onMark, cardId, hasNext, onMarkReviseSound, onTopicComplete]);

  const markCorrect = useCallback(() => {
    onMark?.(cardId, "mastered");
    onMarkCorrectSound?.();
    setLocalCorrect((c) => c + 1);
    if (!hasNext) onTopicComplete?.();
    if (hasNext) {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }, [onMark, cardId, hasNext, onMarkCorrectSound, onTopicComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.key === " ") {
        e.preventDefault();
        flip();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length, flip, goPrev, goNext]);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        No flashcards for this topic.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {index + 1} / {cards.length}
        </span>
        <span>
          Got it: {localCorrect} · Revise: {localRevise}
        </span>
      </div>

      <div
        className="min-h-[140px] w-full md:min-h-[160px]"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="relative w-full min-h-[120px] md:min-h-[140px] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          onClick={flip}
        >
          <div
            className="absolute inset-0 rounded-xl border border-border bg-card p-4 text-left flex flex-col justify-center"
            style={{
              backfaceVisibility: "hidden",
              boxShadow: "0 4px 20px hsl(var(--window-shadow) / 0.1)",
            }}
          >
            <p className="text-sm font-medium text-foreground select-none">
              {card.question}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tap or Space to flip
            </p>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-border bg-muted/50 p-4 text-left flex flex-col justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 4px 20px hsl(var(--window-shadow) / 0.1)",
            }}
          >
            <p className="text-sm font-medium text-foreground select-none">
              {card.answer}
            </p>
          </div>
        </motion.div>
      </div>

      {card.code && (
        <pre className="max-h-32 overflow-auto rounded-lg border border-border bg-muted/80 p-3 text-xs font-mono text-foreground">
          <code>{card.code}</code>
        </pre>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={markRevise}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted os-button"
          >
            Revise later
          </button>
          <button
            type="button"
            onClick={markCorrect}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 os-button"
          >
            Got it
          </button>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          aria-label="Next card"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {!hasNext && cards.length > 1 && (
        <p className="text-center text-xs text-muted-foreground">
          End of deck — use ← to go back.
        </p>
      )}
    </div>
  );
}
