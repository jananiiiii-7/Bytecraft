import { useLanguages } from "@/contexts/LanguageContext";

export function LanguageManager() {
  const { languages, availableLanguages, addLanguage, removeLanguage } =
    useLanguages();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Installed Languages</h3>

      {languages.map((lang) => (
        <div key={lang} className="flex items-center justify-between text-sm">
          <span>{lang}</span>
          <button
            type="button"
            onClick={() => removeLanguage(lang)}
            className="text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      <h3 className="text-sm font-medium mt-4">Available Languages</h3>

      {availableLanguages.map((lang) => (
        <div key={lang} className="flex items-center justify-between text-sm">
          <span>{lang}</span>
          <button
            type="button"
            onClick={() => addLanguage(lang)}
            className="text-primary hover:underline"
          >
            Install
          </button>
        </div>
      ))}
    </div>
  );
}
