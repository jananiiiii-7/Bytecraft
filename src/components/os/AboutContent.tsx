/**
 * About this project — OS-style window content.
 */
export function AboutContent() {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-pixel text-[10px] text-foreground mb-2">
          BYTECRAFT OS
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          A learning OS for developers. Master programming languages through
          flashcards, track XP and streaks, unlock achievements, and compete on
          the leaderboard.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[11px] text-muted-foreground">
          Built with React, TypeScript, Supabase, and Vite. OS-style UI with
          windows, taskbar, and a workstation aesthetic.
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        © ByteCraft — Choose your languages, complete topics, and level up.
      </p>
    </div>
  );
}
