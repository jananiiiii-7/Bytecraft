import { useState } from "react";
import { motion } from "framer-motion";
import { DesktopFolder } from "./DesktopFolder";
import { DesktopWidgets } from "./DesktopWidgets";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import {
  LayoutDashboard,
  User,
  TrendingUp,
  Trophy,
  Settings,
  Bell,
  BookOpen,
  Award,
  Info,
} from "lucide-react";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useLanguages } from "@/contexts/LanguageContext";
import { FlashcardsWindow } from "@/windows/FlashcardsWindow";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Dashboard } from "./Dashboard";
import { Achievements } from "./Achievements";
import { Leaderboard } from "./Leaderboard";
import { AboutContent } from "./AboutContent";

/* ----------------------------------------
   Language Metadata
---------------------------------------- */

const LANGUAGE_META: Record<string, { icon: string; color: string }> = {
  Java: { icon: "☕", color: "orange" },
  "C++": { icon: "⚡", color: "blue" },
  DSA: { icon: "🧮", color: "green" },
  Solidity: { icon: "💎", color: "purple" },
};

/* ----------------------------------------
   Desktop
---------------------------------------- */

export function Desktop({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const { profile } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
  const [flashcardContext, setFlashcardContext] = useState<{
    language: string;
    topic: string;
    difficulty: string;
  } | null>(null);

  // Languages now come from global LanguageContext to avoid prop drilling.
  const { languages } = useLanguages();

  const languageFolders = languages.map((lang) => ({
    id: lang.toLowerCase(),
    name: lang,
    icon: LANGUAGE_META[lang]?.icon ?? "📁",
    color: LANGUAGE_META[lang]?.color ?? "gray",
  }));

  const openWindow = (id: string) => {
    setOpenWindows((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setFocusedWindow(id);
  };

  const closeWindow = (id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w !== id));
    setFocusedWindow((prev) => (prev === id ? null : prev));
  };

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background (BEHIND EVERYTHING) */}
      <div className="absolute inset-0 desktop-grid pointer-events-none -z-10" />

      {/* About this project — bottom-left corner */}
      <button
        type="button"
        onClick={() => openWindow("about")}
        className="absolute bottom-20 left-6 z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors pointer-events-auto"
        title="About this project"
      >
        <Info className="w-4 h-4" />
        <span>About this project</span>
      </button>

      {/* Desktop Content */}
      <div className="absolute inset-0 pb-16 p-6 flex gap-8 desktop-area z-10 pointer-events-auto">
        {/* Folders */}
        <div className="flex flex-col gap-2">
          {languageFolders.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <DesktopFolder
                id={folder.id}
                name={folder.name}
                icon={folder.icon}
                color={folder.color}
                isSelected={selectedFolder === folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                onDoubleClick={() => openWindow(folder.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Widgets */}
        <div className="flex-1 flex justify-end pointer-events-auto">
          <DesktopWidgets
            streakDays={
              (profile as { streak?: number })?.streak ??
              (profile as { streak_days?: number })?.streak_days ??
              0
            }
            totalXp={profile?.xp ?? 0}
            languagesCount={languages.length}
          />
        </div>
      </div>

      {/* Language Windows */}
      {languageFolders.map((folder, i) => (
        <Window
          key={folder.id}
          id={folder.id}
          title={`${folder.name} Learning Module`}
          icon={<span>{folder.icon}</span>}
          isOpen={openWindows.includes(folder.id)}
          isFocused={focusedWindow === folder.id}
          onClose={() => closeWindow(folder.id)}
          onFocus={() => setFocusedWindow(folder.id)}
          defaultPosition={{ x: 150 + i * 30, y: 80 + i * 30 }}
        >
          <LearningContent
            language={folder.name}
            onOpenTopic={(topic, difficulty) => {
              setFlashcardContext({
                language: folder.name,
                topic,
                difficulty: difficulty ?? "medium",
              });
              openWindow("flashcards");
            }}
          />
        </Window>
      ))}

      {/* Flashcards Window */}
      <Window
        id="flashcards"
        title={
          flashcardContext
            ? `${flashcardContext.language} • ${flashcardContext.topic} • Flashcards`
            : "Flashcards"
        }
        icon={<BookOpen className="w-4 h-4" />}
        isOpen={openWindows.includes("flashcards")}
        isFocused={focusedWindow === "flashcards"}
        onClose={() => closeWindow("flashcards")}
        onFocus={() => setFocusedWindow("flashcards")}
      >
        {flashcardContext ? (
          <FlashcardsWindow
            language={flashcardContext.language}
            topic={flashcardContext.topic}
            difficulty={flashcardContext.difficulty}
          />
        ) : (
          <div className="text-xs text-muted-foreground">
            Select a topic from any language window to start reviewing
            flashcards.
          </div>
        )}
      </Window>

      {/* System Windows */}
      <Window
        id="dashboard"
        title="Dashboard"
        icon={<LayoutDashboard className="w-4 h-4" />}
        isOpen={openWindows.includes("dashboard")}
        isFocused={focusedWindow === "dashboard"}
        onClose={() => closeWindow("dashboard")}
        onFocus={() => setFocusedWindow("dashboard")}
      >
        <Dashboard />
      </Window>

      <Window
        id="profile"
        title="Profile"
        icon={<User className="w-4 h-4" />}
        isOpen={openWindows.includes("profile")}
        isFocused={focusedWindow === "profile"}
        onClose={() => closeWindow("profile")}
        onFocus={() => setFocusedWindow("profile")}
      >
        <ProfileContent />
      </Window>

      <Window
        id="progress"
        title="Progress"
        icon={<TrendingUp className="w-4 h-4" />}
        isOpen={openWindows.includes("progress")}
        isFocused={focusedWindow === "progress"}
        onClose={() => closeWindow("progress")}
        onFocus={() => setFocusedWindow("progress")}
      >
        <ProgressContent />
      </Window>

      <Window
        id="achievements"
        title="Achievements"
        icon={<Trophy className="w-4 h-4" />}
        isOpen={openWindows.includes("achievements")}
        isFocused={focusedWindow === "achievements"}
        onClose={() => closeWindow("achievements")}
        onFocus={() => setFocusedWindow("achievements")}
      >
        <Achievements />
      </Window>

      <Window
        id="leaderboard"
        title="Leaderboard"
        icon={<Award className="w-4 h-4" />}
        isOpen={openWindows.includes("leaderboard")}
        isFocused={focusedWindow === "leaderboard"}
        onClose={() => closeWindow("leaderboard")}
        onFocus={() => setFocusedWindow("leaderboard")}
      >
        <Leaderboard />
      </Window>

      <Window
        id="settings"
        title="Settings"
        icon={<Settings className="w-4 h-4" />}
        isOpen={openWindows.includes("settings")}
        isFocused={focusedWindow === "settings"}
        onClose={() => closeWindow("settings")}
        onFocus={() => setFocusedWindow("settings")}
      >
        <SettingsContent
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </Window>

      <Window
        id="notifications"
        title="Notifications"
        icon={<Bell className="w-4 h-4" />}
        isOpen={openWindows.includes("notifications")}
        isFocused={focusedWindow === "notifications"}
        onClose={() => closeWindow("notifications")}
        onFocus={() => setFocusedWindow("notifications")}
      >
        <NotificationsContent />
      </Window>

      <Window
        id="about"
        title="About this project"
        icon={<Info className="w-4 h-4" />}
        isOpen={openWindows.includes("about")}
        isFocused={focusedWindow === "about"}
        onClose={() => closeWindow("about")}
        onFocus={() => setFocusedWindow("about")}
      >
        <AboutContent />
      </Window>

      {/* Taskbar */}
      <Taskbar
        onOpenWindow={openWindow}
        activeWindows={openWindows}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    </motion.div>
  );
}

/* ----------------------------------------
   CONTENT COMPONENTS
---------------------------------------- */

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Intermediate" },
  { value: "hard", label: "Hard" },
] as const;

function LearningContent({
  language,
  onOpenTopic,
}: {
  language: string;
  onOpenTopic: (topic: string, difficulty: string) => void;
}) {
  const [difficulty, setDifficulty] = useState<string>("medium");
  const topics = [
    { name: "Introduction", progress: 100 },
    { name: "Basics", progress: 75 },
    { name: "Intermediate", progress: 40 },
    { name: "Advanced", progress: 10 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
          Difficulty for flashcards
        </p>
        <div className="flex flex-wrap gap-1">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                difficulty === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {topics.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onOpenTopic(t.name, difficulty)}
            className="w-full text-left space-y-1 rounded-md p-2 hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <div className="flex justify-between text-sm mb-1">
              <span>{t.name}</span>
              <span>{t.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${t.progress}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileContent() {
  const { user, profile } = useAuth();
  
  // Create a pseudo-random ID string based on user ID or email
  const displayId = user?.id?.substring(0, 10).toUpperCase() || "B-1337-CODE";
  const issueDate = new Date(user?.created_at || Date.now()).toLocaleDateString("en-US", { year: 'numeric', month: '2-digit', day: '2-digit' });
  const username = profile?.username ?? user?.email?.split('@')[0] ?? "ANONYMOUS";
  const xp = profile?.xp ?? 0;

  let userClass = "NOVICE";
  if (xp > 1000) userClass = "HACKER";
  if (xp > 5000) userClass = "WIZARD";
  if (xp > 10000) userClass = "ARCHITECT";

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-fade-in shadow-inner rounded-xl bg-background/50">
      <div className="driver-license-card group transition-transform duration-500 hover:scale-[1.02] cursor-default">
        {/* Header Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-blue-600/90 flex flex-col items-center justify-center border-b border-blue-400/50 shadow-sm z-10 backdrop-blur-md">
          <h2 className="text-white font-bold tracking-widest text-[14px]" style={{ fontFamily: 'Impact, sans-serif' }}>
            BYTECRAFT OS DRIVER LICENSE
          </h2>
        </div>

        {/* State/Theme emblem (background watermark) */}
        <div className="absolute right-4 top-14 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-current flex items-center justify-center animate-spin" style={{ animationDuration: '30s' }}>
            <span className="text-4xl">💻</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative pt-12 pb-2 px-2 flex gap-4 h-full z-10">
          
          {/* Left Column: Photo & Signature */}
          <div className="flex flex-col items-center gap-3 w-1/3">
            <div className="relative p-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg shadow-md">
              <div className="bg-background rounded-md overflow-hidden relative group">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={username}
                    className="w-24 h-32 object-cover"
                  />
                ) : (
                  <div className="w-24 h-32 flex items-center justify-center bg-muted text-muted-foreground">
                    <User className="w-12 h-12 opacity-50" />
                  </div>
                )}
                {/* Hologram overlay on photo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-full group-hover:translate-x-full duration-1000 select-none"></div>
              </div>
            </div>
            
            <div className="w-full text-center border-t border-black/20 dark:border-white/20 pt-1 mt-1">
              <p className="font-handwriting text-lg leading-none transform -rotate-2 opacity-80" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                {username}
              </p>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex-1 flex flex-col justify-between font-sans">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end border-b border-border/50 pb-1">
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-tight">DL NO.</div>
                <div className="text-red-600 dark:text-red-400 font-mono font-bold text-sm tracking-wider">{displayId}</div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] leading-tight mt-2">
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[9px]">EXP</span>
                  <span className="font-bold">NEVER</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[9px]">CLASS</span>
                  <span className="font-bold">{userClass}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[9px]">ISS</span>
                  <span className="font-medium">{issueDate}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[9px]">XP</span>
                  <span className="font-medium text-green-600 dark:text-green-400 font-mono">{xp}</span>
                </div>
              </div>

              <div className="mt-2 text-sm leading-tight text-foreground bg-accent/20 p-1.5 rounded border border-accent/30">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-[9px] block">NAME</span>
                <span className="font-bold uppercase tracking-wide">{username}</span>
                {user?.email && (
                  <span className="block text-[10px] mt-0.5 opacity-80 break-all">
                    {user.email}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Barcode */}
            <div className="mt-3 flex gap-2 items-end justify-between opacity-80">
              <div className="font-mono text-[8px] leading-[6px] tracking-[-1px] select-none text-foreground/70" style={{ transform: "scaleY(2.5)", transformOrigin: "bottom left" }}>
                || | ||| | || || | ||| | || || | |||
                <br/>
                | || | || ||| | || | ||| || | || | |
              </div>
              <div className="text-[8px] font-bold text-muted-foreground w-12 text-center">
                <span className="block border border-current rounded-sm">DL</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressContent() {
  const { profile } = useAuth();
  const { languages } = useLanguages();

  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="text-muted-foreground">XP:</span>{" "}
        <span className="font-mono">{profile?.xp ?? 0}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Streak:</span>{" "}
        <span className="font-mono">
          {(profile as { streak?: number })?.streak ??
            (profile as { streak_days?: number })?.streak_days ??
            0}{" "}
          days
        </span>
      </p>
      <p>
        <span className="text-muted-foreground">Languages installed:</span>{" "}
        <span className="font-mono">{languages.length}</span>
      </p>
    </div>
  );
}

function NotificationsContent() {
  return <div className="text-sm">No new notifications</div>;
}
