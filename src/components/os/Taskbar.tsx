import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  User,
  TrendingUp,
  Trophy,
  Settings,
  Bell,
  Sun,
  Moon,
  Award,
} from "lucide-react";

interface TaskbarProps {
  onOpenWindow: (windowId: string) => void;
  activeWindows: string[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const taskbarItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "profile", icon: User, label: "Profile" },
  { id: "progress", icon: TrendingUp, label: "Progress" },
  { id: "achievements", icon: Trophy, label: "Achievements" },
  { id: "leaderboard", icon: Award, label: "Leaderboard" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "notifications", icon: Bell, label: "Notifications" },
];

function useDateTime() {
  const [dateTime, setDateTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return dateTime;
}

export function Taskbar({
  onOpenWindow,
  activeWindows,
  darkMode,
  onToggleDarkMode,
}: TaskbarProps) {
  const now = useDateTime();
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // z-[100] so taskbar is always above windows (z-40/z-50) and remains clickable.
  return (
    <motion.div
      className="taskbar z-[100] pointer-events-auto"
      initial={{ y: 56 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between w-full gap-2 px-2 py-1">
        <div className="flex items-center gap-1 rounded-xl bg-muted/50">
          {taskbarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeWindows.includes(item.id);

            return (
              <motion.button
                key={item.id}
                type="button"
                className={`taskbar-icon relative ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenWindow(item.id);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                title={item.label}
              >
                <Icon className="w-5 h-5 text-foreground/70" />
                {isActive && (
                  <motion.div
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    layoutId={`indicator-${item.id}`}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Separator */}
          <div className="w-px h-6 bg-border mx-2" />

          {/* Theme Toggle */}
          <motion.button
            type="button"
            className="taskbar-icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleDarkMode();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-foreground/70" />
            ) : (
              <Moon className="w-5 h-5 text-foreground/70" />
            )}
          </motion.button>
        </div>

        {/* Date & time (right side, like a real desktop) */}
        <div className="flex flex-col items-end text-[11px] text-foreground/80 font-mono shrink-0 px-2">
          <span>{timeStr}</span>
          <span className="text-[10px] text-muted-foreground">{dateStr}</span>
        </div>
      </div>
    </motion.div>
  );
}
