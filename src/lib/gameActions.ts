import { supabase } from "@/lib/supabase";

/* ----------------------------------------
   Database contract (exact names):
   - user_profiles(user_id, username, xp, streak, last_active)
   - user_achievements(user_id, achievement_id, unlocked_at)
   - achievements(id, code, title, description, xp_reward)
   - user_languages(id, user_id, language_id, installed_at)
   - flashcards(id, user_id, language_id, topic, question, answer, difficulty)
   - daily_facts(id, user_id, fact, category, difficulty)
   - user_progress(id, user_id, language_id, topic, progress)
---------------------------------------- */

export type ActivityType =
  | "login"
  | "daily_fact"
  | "flashcard_correct"
  | "flashcard_wrong"
  | "topic_complete";

/** XP awarded per activity type (centralized). */
const XP_BY_ACTIVITY: Record<ActivityType, number> = {
  login: 10,
  daily_fact: 5,
  flashcard_correct: 10,
  flashcard_wrong: 2,
  topic_complete: 25,
};

/** Returns today's date string in UTC (YYYY-MM-DD) for streak comparison. */
function todayUTC(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Returns yesterday's date string in UTC. */
function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetches the current authenticated user. Throws if not authenticated.
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("User not authenticated");
  }
  return user;
}

/**
 * Ensures a user_profiles row exists for the user; returns current row or null.
 * Uses exact columns: user_id, username, xp, streak, last_active.
 */
async function ensureProfileAndGet(
  userId: string,
  username: string | null,
): Promise<{ xp: number; streak: number; last_active: string | null } | null> {
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("user_id, xp, streak, last_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return {
      xp: Number(existing.xp) || 0,
      streak: Number(existing.streak) || 0,
      last_active: existing.last_active as string | null,
    };
  }

  const { error: insertError } = await supabase.from("user_profiles").insert({
    user_id: userId,
    username,
    xp: 0,
    streak: 1,
    last_active: todayUTC(),
  });
  if (insertError) {
    console.error(
      "gameActions: failed to create user_profiles row",
      insertError,
    );
    return null;
  }
  return { xp: 0, streak: 1, last_active: todayUTC() };
}

/**
 * Computes new streak from last_active and current date.
 * - If last_active is today: keep current streak.
 * - If last_active is yesterday: increment streak.
 * - Otherwise: reset to 1.
 */
function computeStreak(
  currentStreak: number,
  lastActive: string | null,
): number {
  const today = todayUTC();
  const yesterday = yesterdayUTC();
  if (!lastActive) return 1;
  const last = lastActive.slice(0, 10);
  if (last === today) return currentStreak;
  if (last === yesterday) return currentStreak + 1;
  return 1;
}

/**
 * Calculates user Level based on total XP using a square root curve.
 * Formula: Level = floor(sqrt(totalXp / 50)) + 1
 * Returns current level, XP required for current level floor, and XP required for next level.
 */
export function calculateLevel(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  const currentLevel = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const currentLevelXp = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelXp = Math.pow(currentLevel, 2) * 50;
  return { currentLevel, currentLevelXp, nextLevelXp };
}

/**
 * Checks and claims a daily login reward for persistent sessions.
 * Capped daily reward: 10 Base XP + (Streak * 2 XP), max 50 extra XP.
 * Returns the status, reward amount, and new streak.
 */
export async function claimDailyReward(): Promise<{
  claimed: boolean;
  rewardXp?: number;
  newStreak?: number;
}> {
  try {
    const user = await getCurrentUser();
    const username =
      (user.user_metadata?.username as string) ??
      user.email?.split("@")[0] ??
      null;

    const current = await ensureProfileAndGet(user.id, username);
    if (!current) return { claimed: false };

    const today = todayUTC();
    const last = current.last_active?.slice(0, 10);

    // Already claimed today
    if (last === today) {
      return { claimed: false };
    }

    const newStreak = computeStreak(current.streak, current.last_active);

    // Base reward of 10 XP + up to 50 XP bonus based on streak length
    const streakBonus = Math.min(newStreak * 2, 50);
    const rewardXp = 10 + streakBonus;
    const newXp = current.xp + rewardXp;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        xp: newXp,
        streak: newStreak,
        last_active: today,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("gameActions: failed to claim daily reward", updateError);
      return { claimed: false };
    }

    // Check achievements asynchronously without blocking the return
    checkAndUnlockAchievements().catch(console.error);

    return { claimed: true, rewardXp, newStreak };
  } catch (e) {
    console.error("gameActions: claimDailyReward failed", e);
    return { claimed: false };
  }
}

/**
 * Records user activity: updates user_profiles (xp, streak, last_active)
 * and then runs achievement checks.
 * Uses Supabase client only; respects RLS.
 */
export async function recordUserActivity(
  type: ActivityType,
): Promise<{ ok: boolean; error?: string; newUnlocks?: string[] }> {
  try {
    const user = await getCurrentUser();
    const xpDelta = XP_BY_ACTIVITY[type];
    const username =
      (user.user_metadata?.username as string) ??
      user.email?.split("@")[0] ??
      null;

    const current = await ensureProfileAndGet(user.id, username);
    if (!current)
      return {
        ok: false,
        error: "Could not load or create profile",
        newUnlocks: [],
      };

    const today = todayUTC();
    const newStreak = computeStreak(current.streak, current.last_active);
    const newXp = current.xp + xpDelta;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        xp: newXp,
        streak: newStreak,
        last_active: today,
        ...(username != null && { username }),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("gameActions: failed to update user_profiles", updateError);
      return { ok: false, error: updateError.message, newUnlocks: [] };
    }

    const newUnlocks = await checkAndUnlockAchievements();
    return { ok: true, newUnlocks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("gameActions: recordUserActivity failed", e);
    return { ok: false, error: msg, newUnlocks: [] };
  }
}

/**
 * Reads user stats and achievement definitions, then inserts into
 * user_achievements for any newly unlocked achievements (by code).
 * Avoids duplicate unlocks by checking existing user_achievements.
 * Returns codes of newly unlocked achievements for toast/pulse UI.
 */
export async function checkAndUnlockAchievements(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const [
      profileRes,
      unlockedRes,
      achievementsRes,
      langRes,
      flashRes,
      dailyRes,
      progressRes,
    ] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("xp, streak")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),
      supabase.from("achievements").select("id, code"),
      supabase
        .from("user_languages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("daily_facts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase.from("user_progress").select("progress").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const unlockedRows = unlockedRes.data;
    const achievements = achievementsRes.data;
    const languagesCount = langRes.count || 0;
    const flashcardsCount = flashRes.count || 0;
    const dailyFactsCount = dailyRes.count || 0;

    const progressRows = progressRes.data;

    const xp = Number(profile?.xp);
    const safeXp = Number.isFinite(xp) ? xp : 0;

    const streak = Number(profile?.streak) || 0;

    const unlockedIds = new Set(
      (unlockedRows ?? []).map((r) => r.achievement_id as string),
    );
    const completedTopics =
      progressRows?.filter((r) => Number(r.progress) >= 100).length ?? 0;

    type Condition = () => boolean;
    const conditions: Record<string, Condition> = {
      first_login: () => true,
      streak_7: () => streak >= 7,
      streak_30: () => streak >= 30,
      xp_100: () => xp >= 100,
      xp_500: () => xp >= 500,
      languages_3: () => languagesCount >= 3,
      flashcards_10: () => flashcardsCount >= 10,
      daily_fact_1: () => dailyFactsCount >= 1,

      topic_complete_1: () => completedTopics >= 1,
    };

    const toUnlock =
      achievements?.filter(
        (a) => !unlockedIds.has(a.id) && conditions[a.code as string]?.(),
      ) ?? [];

    const newlyUnlockedCodes: string[] = [];
    for (const a of toUnlock) {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: a.id,
        unlocked_at: new Date().toISOString(),
      });
      if (error)
        console.warn(
          "gameActions: could not unlock achievement",
          a.code,
          error,
        );
      else newlyUnlockedCodes.push(a.code as string);
    }
    return newlyUnlockedCodes;
  } catch (e) {
    console.error("gameActions: checkAndUnlockAchievements failed", e);
    return [];
  }
}
