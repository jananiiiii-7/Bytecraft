import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DesktopFolderProps {
  id: string;
  name: string;
  icon: ReactNode;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  color?: string;
}

export function DesktopFolder({
  id,
  name,
  icon,
  isSelected,
  onClick,
  onDoubleClick,
  color = "primary",
}: DesktopFolderProps) {
  return (
    <motion.div
      className={`desktop-folder ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${
          isSelected ? "bg-primary/20" : "bg-muted/50"
        }`}
        whileHover={{
          boxShadow: "0 8px 24px hsl(var(--primary) / 0.15)",
        }}
      >
        <span className="text-3xl">{icon}</span>
      </motion.div>
      <span className="font-medium text-xs text-center text-foreground/90 max-w-20 truncate">
        {name}
      </span>
    </motion.div>
  );
}
