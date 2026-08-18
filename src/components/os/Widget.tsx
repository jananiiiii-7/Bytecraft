import { motion } from "framer-motion";
import { ReactNode } from "react";

interface WidgetProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function Widget({ title, icon, children, className = "", delay = 0 }: WidgetProps) {
  return (
    <motion.div
      className={`widget-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 24px hsl(var(--window-shadow) / 0.12)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="font-medium text-sm text-foreground/90">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}
