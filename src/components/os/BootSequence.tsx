import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

const bootMessages = [
  "Initializing ByteCraft OS...",
  "Loading system modules...",
  "Mounting learning filesystem...",
  "Starting knowledge engine...",
  "Preparing workspace...",
  "Welcome to ByteCraft",
];

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Message cycling based on progress
  useEffect(() => {
    const messageIndex = Math.min(
      Math.floor((progress / 100) * bootMessages.length),
      bootMessages.length - 1
    );
    if (messageIndex !== currentMessageIndex) {
      setCurrentMessageIndex(messageIndex);
      setDisplayedText("");
    }
  }, [progress, currentMessageIndex]);

  // Typewriter effect
  useEffect(() => {
    const currentMessage = bootMessages[currentMessageIndex];
    if (displayedText.length < currentMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, currentMessageIndex]);

  // Complete boot sequence
  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="boot-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-glow-primary">
            <span className="font-pixel text-2xl text-primary">BC</span>
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ 
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.2)",
                "0 0 40px hsl(var(--primary) / 0.4)",
                "0 0 20px hsl(var(--primary) / 0.2)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-pixel text-lg text-foreground tracking-wider"
        >
          ByteCraft
        </motion.h1>

        {/* Boot message with typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="h-6 flex items-center"
        >
          <span className="font-mono text-sm text-muted-foreground">
            {displayedText}
          </span>
          <span
            className={`inline-block w-2 h-4 ml-1 bg-primary transition-opacity ${
              showCursor ? "opacity-100" : "opacity-0"
            }`}
          />
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="boot-progress w-72"
        >
          <motion.div
            className="boot-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </motion.div>

        {/* Progress percentage */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="font-mono text-xs text-muted-foreground"
        >
          {progress}%
        </motion.p>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="font-mono text-xs text-muted-foreground"
        >
          v1.0.0 • Learning OS
        </motion.p>
      </div>
    </motion.div>
  );
}
