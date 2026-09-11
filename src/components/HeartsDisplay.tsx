"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ShakeOnTrigger from "@/components/animations/ShakeOnTrigger";

interface HeartsDisplayProps {
  hearts: number;
  maxHearts: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface LossMarker {
  id: number;
}

const SIZE_PX: Record<"sm" | "md" | "lg", number> = { sm: 18, md: 24, lg: 30 };

export default function HeartsDisplay({ hearts, maxHearts, size = "md", className }: HeartsDisplayProps) {
  const iconPx = SIZE_PX[size];
  const unlimited = !Number.isFinite(maxHearts);
  const previousHearts = useRef(hearts);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [losses, setLosses] = useState<LossMarker[]>([]);
  const lossIdRef = useRef(0);
  const pendingTimeouts = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (hearts < previousHearts.current) {
      setShakeTrigger((t) => t + 1);
      const id = ++lossIdRef.current;
      setLosses((prev) => [...prev, { id }]);
      const timeout = setTimeout(() => {
        setLosses((prev) => prev.filter((l) => l.id !== id));
        pendingTimeouts.current.delete(timeout);
      }, 900);
      pendingTimeouts.current.add(timeout);
    }
    previousHearts.current = hearts;
  }, [hearts]);

  useEffect(() => {
    const timeouts = pendingTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  if (unlimited) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-danger-500/10 px-3 py-1",
          className,
        )}
      >
        <Heart size={iconPx} className="fill-danger-500 stroke-danger-600" />
        <InfinityIcon size={iconPx * 0.8} className="stroke-ink" strokeWidth={3} />
      </div>
    );
  }

  const slots = Array.from({ length: Math.max(maxHearts, 0) }, (_, i) => i < hearts);

  return (
    <ShakeOnTrigger
      trigger={shakeTrigger}
      className={cn("relative inline-flex items-center gap-1", className)}
    >
      {slots.map((filled, i) => (
        <Heart
          key={i}
          size={iconPx}
          className={filled ? "fill-danger-500 stroke-danger-600" : "fill-transparent stroke-ink/25"}
          strokeWidth={filled ? 1.5 : 2}
        />
      ))}
      <AnimatePresence>
        {losses.map((loss) => (
          <motion.span
            key={loss.id}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none absolute -top-1 right-0 font-display text-sm font-bold text-danger-600"
          >
            -1
          </motion.span>
        ))}
      </AnimatePresence>
    </ShakeOnTrigger>
  );
}
