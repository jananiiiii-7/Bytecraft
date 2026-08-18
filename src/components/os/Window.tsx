import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useDragControls, AnimatePresence } from "framer-motion";
import { X, Minus, Square } from "lucide-react";

interface WindowProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onFocus: () => void;
  isFocused: boolean;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
}

export function Window({
  id,
  title,
  icon,
  children,
  isOpen,
  onClose,
  onFocus,
  isFocused,
  defaultPosition = { x: 100, y: 50 },
  defaultSize = { width: 600, height: 400 },
  minWidth = 300,
  minHeight = 200,
}: WindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [prevState, setPrevState] = useState({
    position: defaultPosition,
    size: defaultSize,
  });
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(prevState.position);
      setSize(prevState.size);
    } else {
      setPrevState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 56 });
    }
    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {!isMinimized && (
        <motion.div
          ref={constraintsRef}
          className="fixed inset-0"
          style={{ zIndex: isFocused ? 50 : 40 }}
        >
          <motion.div
            className={`os-window absolute pointer-events-auto ${
              isFocused ? "ring-2 ring-primary/20" : "opacity-95"
            }`}
            style={{
              width: isMaximized ? "100%" : size.width,
              height: isMaximized ? "calc(100vh - 56px)" : size.height,
              minWidth,
              minHeight,
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: position.x,
              top: position.y,
              left: 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag={!isMaximized}
            dragControls={dragControls}
            dragMomentum={false}
            dragListener={false}
            onDragEnd={(_, info) => {
              setPosition({
                x: position.x + info.offset.x,
                y: position.y + info.offset.y,
              });
            }}
            onClick={onFocus}
          >
            {/* Window Header */}
            <div
              className="os-window-header cursor-move select-none"
              onPointerDown={(e) => {
                onFocus();
                if (!isMaximized) {
                  dragControls.start(e);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="os-window-button os-window-button-close hover:scale-110 transition-transform"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinimize();
                  }}
                  className="os-window-button os-window-button-minimize hover:scale-110 transition-transform"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMaximize();
                  }}
                  className="os-window-button os-window-button-maximize hover:scale-110 transition-transform"
                />
              </div>
              <div className="flex-1 flex items-center justify-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                <span className="font-medium text-sm text-foreground/80 truncate">
                  {title}
                </span>
              </div>
              <div className="w-16" /> {/* Spacer for symmetry */}
            </div>

            {/* Window Content */}
            <div
              className="flex-1 overflow-auto p-4"
              style={{ height: `calc(100% - 48px)` }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
