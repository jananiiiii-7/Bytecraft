import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "@/hooks/use-toast";

type NewUnlocksContextValue = {
  /** Codes of achievements just unlocked (for one-time pulse in Achievements UI). */
  lastUnlockedCodes: string[];
  /** Call when recordUserActivity returns newUnlocks: shows toast and triggers pulse. */
  reportNewUnlocks: (codes: string[]) => void;
};

const NewUnlocksContext = createContext<NewUnlocksContextValue | undefined>(
  undefined
);

/** Module-level ref so non-React code (e.g. AuthContext onAuthStateChange) can report unlocks. */
const reportRef = { current: null as ((codes: string[]) => void) | null };

/** Call from anywhere (e.g. AuthContext) when recordUserActivity returns newUnlocks. */
export function reportAchievementUnlocks(codes: string[]): void {
  if (codes.length && reportRef.current) reportRef.current(codes);
}

export function NewUnlocksProvider({ children }: { children: ReactNode }) {
  const [lastUnlockedCodes, setLastUnlockedCodes] = useState<string[]>([]);

  const reportNewUnlocks = useCallback((codes: string[]) => {
    if (!codes.length) return;
    setLastUnlockedCodes(codes);
    toast({
      title: "Achievement unlocked!",
      description:
        codes.length === 1 ? codes[0] : `${codes.length} achievements unlocked`,
    });
    // Clear after animation so pulse stops (one-time).
    setTimeout(() => setLastUnlockedCodes([]), 3000);
  }, []);

  useEffect(() => {
    reportRef.current = reportNewUnlocks;
    return () => {
      reportRef.current = null;
    };
  }, [reportNewUnlocks]);

  const value: NewUnlocksContextValue = {
    lastUnlockedCodes,
    reportNewUnlocks,
  };

  return (
    <NewUnlocksContext.Provider value={value}>
      {children}
    </NewUnlocksContext.Provider>
  );
}

export function useNewUnlocks() {
  const ctx = useContext(NewUnlocksContext);
  if (!ctx) return { lastUnlockedCodes: [], reportNewUnlocks: () => {} };
  return ctx;
}
