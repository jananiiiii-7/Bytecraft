import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguages } from "@/contexts/LanguageContext";
import { Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* Match Desktop LANGUAGE_META for icons/colors */
const LANGUAGE_META: Record<string, { icon: string; color: string }> = {
  Java: { icon: "☕", color: "orange" },
  "C++": { icon: "⚡", color: "blue" },
  DSA: { icon: "🧮", color: "green" },
  Solidity: { icon: "💎", color: "purple" },
};

export default function LanguageSetup() {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { availableLanguages, addLanguage, reloadLanguages } = useLanguages();
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ IMPORTANT

  const toggle = (lang: string) => {
    setSelected((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const save = async () => {
    if (!selected.length || !user) return;

    setSaving(true);

    try {
      // 1️⃣ Install selected languages
      await Promise.all(selected.map((lang) => addLanguage(lang, true)));

      // 2️⃣ Reload language state (updates context)
      await reloadLanguages();

      // 3️⃣ OPTIONAL: unlock achievements
      const { checkAndUnlockAchievements } = await import("@/lib/gameActions");
      checkAndUnlockAchievements().catch(() => {});

      // 4️⃣ 🚀 HARD EXIT SETUP → DESKTOP
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to save languages:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 p-4">
      <div className="absolute inset-0 desktop-grid opacity-50 pointer-events-none" />

      <motion.div
        className="relative w-full max-w-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="os-window overflow-hidden">
          {/* Title bar */}
          <div className="os-window-header flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>

            <div className="flex-1 flex items-center justify-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-pixel text-[10px]">
                BYTECRAFT OS — SETUP
              </span>
            </div>

            <div className="w-16" />
          </div>

          {/* Content */}
          <div className="p-6">
            <h1 className="font-pixel text-xs mb-1">CHOOSE YOUR LANGUAGES</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Pick at least one language. You can add more later.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {availableLanguages.map((lang) => {
                const meta = LANGUAGE_META[lang];
                const isSelected = selected.includes(lang);

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggle(lang)}
                    className={`widget-card p-4 flex flex-col items-center gap-2 border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{meta?.icon ?? "📁"}</span>
                    <span className="text-sm">{lang}</span>
                    {isSelected && (
                      <span className="font-pixel text-[10px] text-primary">
                        SELECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selected.length || saving}
              onClick={save}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Installing…" : "Continue"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
