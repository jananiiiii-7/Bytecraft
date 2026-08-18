import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CircleCheck, Moon, Search, SlidersHorizontal, Sparkles, Sun, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AssessmentFlow, AuthDialog } from "./AssessmentFlow";
import "./v1.css";

const themeKey = "bytecraft-theme";
function initialTheme(): "light" | "dark" { const saved = localStorage.getItem(themeKey); if (saved === "dark" || saved === "light") return saved; return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }

export function V1App() {
  const { user, learnerState, learnerStateLoading, learnerStateError, refreshLearnerState } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [authOpen, setAuthOpen] = useState(window.location.pathname === "/reset-password");
  const resetMode = window.location.pathname === "/reset-password";
  useEffect(() => { localStorage.setItem(themeKey, theme); document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.dataset.theme = theme; }, [theme]);
  return <div className="v1-app" data-theme={theme}>
    <header className="v1-nav">
      <button className="v1-brand" onClick={() => window.location.reload()} aria-label="Return to ByteCraft home"><b>B</b><span>bytecraft<small>your coding studio</small></span></button>
      <nav className="v1-shell-nav" aria-label="Primary navigation"><button className="active"><BookOpen size={16} /><span>Learning plan</span></button><button aria-label="Community"><UsersRound size={16} /></button><button aria-label="Progress"><CircleCheck size={16} /></button><button aria-label="Calendar"><CalendarDays size={16} /></button><button aria-label="Preferences"><SlidersHorizontal size={16} /></button></nav>
      <div className="v1-nav-actions">{!user && <button className="v1-sign-in" onClick={() => setAuthOpen(true)}>Sign in</button>}<button className="v1-icon-button" aria-label="Search"><Search size={17} /></button><button className="v1-theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}><span>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</span><small>{theme === "light" ? "Dark" : "Light"}</small></button><div className="v1-profile-chip"><span className="v1-profile-avatar">{user ? "Y" : "B"}</span><span><b>{user ? "Your studio" : "Guest learner"}</b><small>{theme === "light" ? "Soft light" : "Night studio"}</small></span></div></div>
    </header>
    <main className="v1-shell-main"><div className="v1-context-line"><span><Sparkles size={14} /> PERSONAL CODING STUDIO</span><span>CONCEPT <i>→</i> PROBLEM <i>→</i> INSIGHT</span></div><div className="studio-workspace"><aside className="studio-rail"><div className="studio-rail-top"><span className="studio-index">01</span><span className="studio-rail-caption">your path</span></div><div className="studio-path-line"><span className="studio-node current" /><span className="studio-node" /><span className="studio-node" /><span className="studio-node" /></div><div className="studio-rail-copy"><span className="studio-kicker">CURRENT FOCUS</span><strong>Recognize<br />the pattern.</strong><p>Small evidence. Better next steps.</p></div><div className="studio-sticker">think<br />first <span>✦</span></div></aside><section className="studio-canvas"><AssessmentFlow user={user} learnerState={learnerState} learnerStateLoading={learnerStateLoading} learnerStateError={learnerStateError} onLearnerStateChange={refreshLearnerState} onComplete={() => undefined} /></section><aside className="studio-notes"><div className="notes-orb">B</div><span className="studio-kicker">BYTE'S NOTE</span><h3>Good learning<br />leaves a trace.</h3><p>I'll notice the choices you make, not just whether the answer was right.</p><div className="notes-chip"><span>✦</span> evidence first</div><div className="notes-pin">↗</div></aside></div></main>{authOpen && <AuthDialog initialMode={resetMode ? "reset" : "signin"} onClose={() => { setAuthOpen(false); if (resetMode) window.history.replaceState({}, "", "/"); }} />}
  </div>;
}
