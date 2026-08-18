import { LanguageManager } from "./LanguageManager";

export function SettingsContent({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Theme Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div>
          <h4 className="font-medium text-sm">Dark Mode</h4>
          <p className="text-xs text-muted-foreground">
            Toggle light / dark theme
          </p>
        </div>

        <button
          onClick={onToggleDarkMode}
          className={`w-12 h-6 rounded-full ${
            darkMode ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              darkMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Language Manager */}
      <LanguageManager />
    </div>
  );
}
