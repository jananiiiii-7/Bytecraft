import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { LoginForm } from "./auth/LoginForm";
import { RegisterForm } from "./auth/RegisterForm";
import { ForgotPasswordForm } from "./auth/ForgotPasswordForm";

type AuthView = "login" | "register" | "forgot";

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
};

export default function AuthWindow() {
  const [view, setView] = useState<AuthView>("login");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const goTo = (next: AuthView, dir: number = 1) => {
    setDirection(dir);
    setView(next);
    setError(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 p-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 desktop-grid opacity-50 pointer-events-none" />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* OS-style window */}
        <div
          className="os-window overflow-hidden"
          style={{
            boxShadow:
              "0 25px 50px -12px hsl(var(--window-shadow) / 0.3), 0 0 0 1px hsl(var(--window-border) / 0.6), 0 0 40px -8px hsl(var(--primary) / 0.12)",
          }}
        >
          {/* Title bar */}
          <div className="os-window-header flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4 text-muted-foreground" />
              <span className="font-pixel text-[10px] text-foreground/90 tracking-wide">
                BYTECRAFT OS — AUTH
              </span>
            </div>
            <div className="w-16" />
          </div>

          {/* Content */}
          <div className="p-6 pt-5">
            <div className="mb-4">
              <h1 className="font-pixel text-xs text-foreground mb-1">
                {view === "login" && "SIGN IN"}
                {view === "register" && "CREATE ACCOUNT"}
                {view === "forgot" && "RESET PASSWORD"}
              </h1>
              <p className="text-sm text-muted-foreground font-normal">
                {view === "login" && "Enter your credentials to continue."}
                {view === "register" && "Register with email or Google."}
                {view === "forgot" && "We’ll send you a reset link."}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              {view === "login" && (
                <motion.div
                  key="login"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm
                    onSwitchToRegister={() => goTo("register", 1)}
                    onSwitchToForgot={() => goTo("forgot", 1)}
                    setError={setError}
                  />
                </motion.div>
              )}
              {view === "register" && (
                <motion.div
                  key="register"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm
                    onSwitchToLogin={() => goTo("login", -1)}
                    setError={setError}
                  />
                </motion.div>
              )}
              {view === "forgot" && (
                <motion.div
                  key="forgot"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <ForgotPasswordForm
                    onSwitchToLogin={() => goTo("login", -1)}
                    setError={setError}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
