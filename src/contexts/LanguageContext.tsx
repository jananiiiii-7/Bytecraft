import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { checkAndUnlockAchievements } from "@/lib/gameActions";

type LanguageContextValue = {
  languages: string[];
  availableLanguages: string[];
  isLoading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  addLanguage: (language: string, skipReload?: boolean) => Promise<void>;
  removeLanguage: (language: string) => Promise<void>;
  reloadLanguages: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [languages, setLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Critical: prevents flicker / redirect loops
  const hasLoadedOnce = useRef(false);

  const loadAllLanguages = useCallback(async () => {
    if (!user) {
      setLanguages([]);
      setAvailableLanguages([]);
      setIsLoading(false);
      hasLoadedOnce.current = true;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1️⃣ Load user's installed language IDs
      const { data: ulData, error: ulError } = await supabase
        .from("user_languages")
        .select("language_id")
        .eq("user_id", user.id);

      if (ulError) throw ulError;

      const installedIds = new Set(
        (ulData ?? []).map((r) => r.language_id as string),
      );

      // 2️⃣ Load ALL languages
      const { data: allLangs, error: langError } = await supabase
        .from("languages")
        .select("id, name")
        .order("name", { ascending: true });

      if (langError) throw langError;

      const installed: string[] = [];
      const available: string[] = [];

      for (const lang of allLangs ?? []) {
        if (installedIds.has(lang.id)) {
          installed.push(lang.name);
        } else {
          available.push(lang.name);
        }
      }

      setLanguages(installed);
      setAvailableLanguages(available);
    } catch (e) {
      console.error("[LanguageContext] load failed:", e);
      setLanguages([]);
      setAvailableLanguages([]);
      setError("Failed to load languages");
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [user]);

  useEffect(() => {
    void loadAllLanguages();
  }, [loadAllLanguages]);

  const addLanguage = useCallback(
    async (languageName: string, skipReload = false) => {
      if (!user) return;
      if (languages.includes(languageName)) return;

      const { data: lang } = await supabase
        .from("languages")
        .select("id")
        .eq("name", languageName)
        .maybeSingle();

      if (!lang?.id) {
        setError("Language not found");
        return;
      }

      const { error } = await supabase.from("user_languages").insert({
        user_id: user.id,
        language_id: lang.id,
        installed_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to add language:", error);
        setError("Unable to add language");
        return;
      }

      if (!skipReload) {
        await loadAllLanguages();
        checkAndUnlockAchievements().catch(() => {});
      }
    },
    [user, languages, loadAllLanguages],
  );

  const removeLanguage = useCallback(
    async (languageName: string) => {
      if (!user) return;

      const { data: lang } = await supabase
        .from("languages")
        .select("id")
        .eq("name", languageName)
        .maybeSingle();

      if (!lang?.id) return;

      await supabase
        .from("user_languages")
        .delete()
        .eq("user_id", user.id)
        .eq("language_id", lang.id);

      await loadAllLanguages();
      checkAndUnlockAchievements().catch(() => {});
    },
    [user, loadAllLanguages],
  );

  const reloadLanguages = useCallback(async () => {
    await loadAllLanguages();
  }, [loadAllLanguages]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      languages,
      availableLanguages,
      isLoading,
      hasLoadedOnce: hasLoadedOnce.current,
      error,
      addLanguage,
      removeLanguage,
      reloadLanguages,
    }),
    [
      languages,
      availableLanguages,
      isLoading,
      error,
      addLanguage,
      removeLanguage,
      reloadLanguages,
    ],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguages() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguages must be used within a LanguageProvider");
  }
  return ctx;
}
