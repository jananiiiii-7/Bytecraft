import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNewUnlocks } from "@/contexts/NewUnlocksContext";

/**
 * Achievement row from DB: achievements(id, code, title, description, xp_reward)
 * and user_achievements(user_id, achievement_id, unlocked_at).
 */
type Achievement = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  xp_reward: number | null;
  unlocked_at: string | null;
};

/**
 * Achievements window: lists all achievements with locked/unlocked state.
 * Fetches from achievements and user_achievements (contract column names).
 */
export function Achievements() {
  const { user } = useAuth();
  const { lastUnlockedCodes } = useNewUnlocks();
  const [list, setList] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: achievements, error: e1 } = await supabase
        .from("achievements")
        .select("id, code, title, description, xp_reward");

      if (e1 || !achievements) {
        if (!cancelled) setList([]);
        return;
      }

      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      const unlockedMap = new Map(
        (unlocked ?? []).map((u) => [
          u.achievement_id as string,
          u.unlocked_at as string,
        ])
      );

      const merged: Achievement[] = achievements.map((a) => ({
        ...a,
        title: a.title ?? null,
        description: a.description ?? null,
        xp_reward: a.xp_reward ?? null,
        unlocked_at: unlockedMap.get(a.id) ?? null,
      }));

      if (!cancelled) setList(merged);
    })();

    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Loading achievements…
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {list.length === 0 ? (
        <p className="text-muted-foreground">No achievements defined yet.</p>
      ) : (
        list.map((a) => {
          const unlocked = !!a.unlocked_at;
          const justUnlocked = lastUnlockedCodes.includes(a.code); // One-time pulse (cleared after 3s in context).
          return (
            <div
              key={a.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                unlocked
                  ? "bg-primary/10 border-primary/40"
                  : "bg-muted/40 border-border"
              } ${justUnlocked ? "animate-pulse ring-2 ring-primary/50" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {a.title ?? a.code}
                </p>
                {a.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {a.description}
                  </p>
                )}
                {a.xp_reward != null && a.xp_reward > 0 && (
                  <p className="text-[10px] text-primary mt-1">
                    +{a.xp_reward} XP reward
                  </p>
                )}
              </div>
              <div
                className={`ml-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                  unlocked ? "bg-primary" : "bg-muted-foreground"
                } ${justUnlocked ? "animate-pulse" : ""}`}
                title={unlocked ? "Unlocked" : "Locked"}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
