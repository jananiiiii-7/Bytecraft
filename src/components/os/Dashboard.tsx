import { useAuth } from "@/contexts/AuthContext";
import { useLanguages } from "@/contexts/LanguageContext";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { calculateLevel } from "@/lib/gameActions";

/**
 * Dashboard window content: XP, streak, and a donut/progress chart for XP.
 * Uses profile from AuthContext (user_profiles: xp, streak).
 * OS-style theme; compatible with light/dark.
 */
export function Dashboard() {
  const { profile } = useAuth();
  const { languages } = useLanguages();

  // Support both contract (streak) and legacy (streak_days) column names.
  const xp = Number(profile?.xp) || 0;

  const streakRaw =
    (profile as { streak?: number })?.streak !== undefined
      ? (profile as { streak?: number })?.streak
      : (profile as { streak_days?: number })?.streak_days;

  const streak = Number(streakRaw) || 0;

  const languagesCount = languages.length;

  const { currentLevel, currentLevelXp, nextLevelXp } = calculateLevel(xp);

  // Donut: XP earned vs remaining in the *current level*
  const xpInCurrentLevel = xp - currentLevelXp;
  const levelXpRequirement = nextLevelXp - currentLevelXp;
  const remaining = Math.max(0, levelXpRequirement - xpInCurrentLevel);

  const chartData = [
    { name: "xp", value: xpInCurrentLevel, fill: "var(--color-xp)" },
    {
      name: "remaining",
      value: remaining || 0.1,
      fill: "var(--color-remaining)",
    },
  ];

  const chartConfig: ChartConfig = {
    xp: { label: "XP", color: "hsl(var(--primary))" },
    remaining: { label: "To next", color: "hsl(var(--muted))" },
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-3 gap-3">
        <div className="widget-card rounded-xl p-3 flex flex-col justify-between">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Level {currentLevel}
          </p>
          <div className="flex items-end gap-1 mt-1">
            <p className="text-lg font-semibold font-mono leading-none">{xp}</p>
            <p className="text-[10px] text-muted-foreground font-mono leading-[14px]">
              XP
            </p>
          </div>
        </div>
        <div className="widget-card rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Streak
          </p>
          <p className="mt-1 text-lg font-semibold font-mono">{streak} days</p>
        </div>
        <div className="widget-card rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Languages
          </p>
          <p className="mt-1 text-lg font-semibold font-mono">
            {languagesCount}
          </p>
        </div>
      </div>

      <div className="widget-card rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">
          XP progress
        </p>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              strokeWidth={0}
              paddingAngle={1}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name === "xp"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))"
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <p className="text-center text-[11px] text-muted-foreground mt-2">
          {xpInCurrentLevel} / {levelXpRequirement} XP to Level{" "}
          {currentLevel + 1}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <p className="text-[11px] font-medium text-muted-foreground w-full">
          Your languages
        </p>
        {languages.map((name) => (
          <span
            key={name}
            className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
