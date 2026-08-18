import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
export type LearnerState = { user: { id: string }; onboarding: Record<string, string> | null; assessment: { id: string; status: "in_progress" | "completed"; completedItems: number; currentSequence: number } | null; profile: { hypotheses: Array<Record<string, unknown>>; observations: Array<Record<string, unknown>> } | null; path: { recommendation: Record<string, unknown>; items?: Array<Record<string, unknown>> } | null; recommendation: Record<string, unknown> | null; next: "onboarding" | "assessment" | "path" };

type UserProfile = {
  id: string;
  display_name: string | null;
  username?: string | null;
  xp?: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  learnerState: LearnerState | null;
  learnerStateLoading: boolean;
  learnerStateError: string | null;
  refreshLearnerState: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learnerState, setLearnerState] = useState<LearnerState | null>(null);
  const [learnerStateLoading, setLearnerStateLoading] = useState(false);
  const [learnerStateError, setLearnerStateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn("Unable to restore session:", error.message);
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshLearnerState = useCallback(async () => {
    if (!user || !isSupabaseConfigured) { setLearnerState(null); return; }
    setLearnerStateLoading(true); setLearnerStateError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session could not be restored. Please sign in again.");
      const response = await fetch("/api/me", { headers: { Authorization: "Bearer " + token } });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Unable to load learner state.");
      setLearnerState(body as LearnerState);
    } catch (error) { setLearnerState(null); setLearnerStateError(error instanceof Error ? error.message : "Unable to load learner state."); } finally { setLearnerStateLoading(false); }
  }, [user]);

  useEffect(() => { void refreshLearnerState(); }, [refreshLearnerState]);
  const refreshProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }

    const displayName = user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Learner";
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName })
      .select("id, display_name, created_at, updated_at")
      .single();

    if (error) {
      console.warn("Unable to load profile:", error.message);
      return;
    }
    setProfile(data as UserProfile);
  }, [user]);

  useEffect(() => {
    void refreshProfile();
    if (!user || !isSupabaseConfigured) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) return;
      void fetch("/api/me", { headers: { Authorization: `Bearer ${data.session.access_token}` } }).catch(() => undefined);
    });
  }, [refreshProfile, user]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLearnerState(null);
    setLearnerStateError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured: isSupabaseConfigured,
      learnerState,
      learnerStateLoading,
      learnerStateError,
      refreshLearnerState,
      refreshProfile,
      signOut,
    }),
    [user, profile, loading, learnerState, learnerStateLoading, learnerStateError, refreshLearnerState, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
