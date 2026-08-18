import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, BookOpen, Calendar } from "lucide-react";
import { Widget } from "./Widget";
import { generateDailyFact } from "@/lib/learningContent";
import { recordUserActivity } from "@/lib/gameActions";
import { reportAchievementUnlocks } from "@/contexts/NewUnlocksContext";

type DesktopWidgetsProps = {
  streakDays: number;
  totalXp: number;
  languagesCount: number;
};

const CACHE_KEY = "bytecraft_daily_cs_fact";

export function DesktopWidgets({
  streakDays,
  totalXp,
  languagesCount,
}: DesktopWidgetsProps) {
  const [fact, setFact] = useState<string | null>(null);

  useEffect(() => {
    const cached =
      typeof window !== "undefined" ? sessionStorage.getItem(CACHE_KEY) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { text: string };
        setFact(parsed.text ?? null);
        return;
      } catch {
        // fall through to fetch
      }
    }

    let cancelled = false;
    generateDailyFact()
      .then((data) => {
        if (cancelled) return;
        setFact(data.fact ?? (data as { text?: string }).text ?? null);
        if (typeof window !== "undefined")
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        recordUserActivity("daily_fact")
          .then((r) => {
            if (r.newUnlocks?.length) reportAchievementUnlocks(r.newUnlocks);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setFact(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
      <Widget
        title="Learning Streak"
        icon={<Flame className="w-4 h-4" />}
        delay={0.8}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl font-pixel text-primary">{streakDays}</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Days in a row</p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: Math.min(Math.max(streakDays, 1), 7) }).map(
                (_, idx) => (
                  <motion.div
                    key={idx}
                    className="w-4 h-4 rounded bg-primary/80"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + idx * 0.1 }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </Widget>

      <Widget
        title="Quick Stats"
        icon={<Zap className="w-4 h-4" />}
        delay={0.9}
      >
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total XP</span>
            <span className="font-mono text-foreground">{totalXp}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Languages</span>
            <span className="font-mono text-foreground">{languagesCount}</span>
          </div>
        </div>
      </Widget>

      <Widget
        title="Did You Know?"
        icon={<BookOpen className="w-4 h-4" />}
        delay={1.0}
        className="sm:col-span-2"
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          {fact ??
            "Computer science is about problem solving and systems design, not just writing code."}
        </p>
      </Widget>

      <Widget
        title="Continue Learning"
        icon={<Calendar className="w-4 h-4" />}
        delay={1.1}
        className="sm:col-span-2"
      >
        <motion.button
          className="w-full py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Resume your latest topic from any language window.
        </motion.button>
      </Widget>
    </div>
  );
}
