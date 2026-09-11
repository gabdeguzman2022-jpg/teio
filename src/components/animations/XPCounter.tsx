"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPCounterProps {
  value: number;
  label?: string;
  className?: string;
}

export default function XPCounter({ value, label = "XP", className }: XPCounterProps) {
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(
    motionValue,
    reducedMotion
      ? { stiffness: 1000, damping: 100, mass: 0.2 }
      : { stiffness: 110, damping: 16, mass: 0.7 },
  );
  const display = useTransform(spring, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 font-display font-bold text-primary-700",
        className,
      )}
    >
      <motion.span className="tabular-nums">{display}</motion.span>
      <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
        {label}
      </span>
    </span>
  );
}
