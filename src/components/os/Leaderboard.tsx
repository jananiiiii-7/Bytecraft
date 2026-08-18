import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Leaderboard entry: user_profiles(user_id, username, xp, streak, last_active).
 * Global: top 10 by xp. Weekly: top 10 by xp among users active in last 7 days.
 */
type LeaderboardEntry = {
  user_id: string;
  username: string | null;
  xp: number;
  streak: number;
  rank: number;
};

type Tab = "global" | "weekly";

/** ISO date string for 7 days ago (for weekly filter). */
function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("global");
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: globalData, error: globalErr } = await supabase
        .from("user_profiles")
        .select("user_id, username, xp, streak")
        .order("xp", { ascending: false })
        .limit(10);

      if (!cancelled && !globalErr && globalData) {
        setGlobalEntries(
          globalData.map((row, i) => ({
            user_id: row.user_id as string,
            username: row.username as string | null,
            xp: (row.xp as number) ?? 0,
            streak: (row.streak as number) ?? 0,

            rank: i + 1,
          })),
        );
      }

      const since = sevenDaysAgo();
      const { data: weeklyData, error: weeklyErr } = await supabase
        .from("user_profiles")
        .select("user_id, username, xp, streak, last_active")
        .gte("last_active", since)
        .order("xp", { ascending: false })
        .limit(10);

      if (!cancelled && !weeklyErr && weeklyData) {
        setWeeklyEntries(
          weeklyData.map((row, i) => ({
            user_id: row.user_id as string,
            username: (row.username as string) ?? null,
            xp: Number(row.xp),
            streak: Number(row.streak),

            rank: i + 1,
          })),
        );
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const entries = tab === "global" ? globalEntries : weeklyEntries;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Global = top 10 by xp. Weekly = top 10 by xp among users with last_active in last 7 days. */}
      <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
        <button
          type="button"
          onClick={() => setTab("global")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "global"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Global
        </button>
        <button
          type="button"
          onClick={() => setTab("weekly")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "weekly"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          This week
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {tab === "global"
          ? "Top 10 by XP"
          : "Top 10 by XP (active last 7 days)"}
      </p>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          {tab === "weekly" ? "No activity this week yet." : "No users yet."}
        </p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {entries.map((e) => {
            const isCurrentUser = user && e.user_id === user.id;
            return (
              <div
                key={e.user_id}
                className={`flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0 ${
                  isCurrentUser ? "bg-primary/10" : "bg-card/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground w-5">
                    #{e.rank}
                  </span>
                  <span
                    className={`font-medium truncate ${
                      isCurrentUser ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {e.username || "Anonymous"}
                    {isCurrentUser && " (you)"}
                  </span>
                </div>
                <div className="flex gap-4 shrink-0 text-[11px]">
                  <span className="font-mono text-foreground">{e.xp} XP</span>
                  <span className="font-mono text-muted-foreground">
                    {e.streak}d streak
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
