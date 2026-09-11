"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PressableButtonVariant = "primary" | "accent" | "neutral" | "ghost";
type PressableButtonState = "default" | "correct" | "incorrect";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

interface PressableButtonProps extends NativeButtonProps {
  children: ReactNode;
  variant?: PressableButtonVariant;
  state?: PressableButtonState;
  active?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<PressableButtonVariant, string> = {
  primary: "border-ink bg-primary-500 text-white",
  accent: "border-ink bg-accent-400 text-ink",
  neutral: "border-ink bg-white text-ink",
  ghost: "border-ink/25 bg-transparent text-ink shadow-none",
};

const STATE_CLASSES: Record<Exclude<PressableButtonState, "default">, string> = {
  correct: "border-success-600 bg-success-500 text-white",
  incorrect: "border-danger-600 bg-danger-500 text-white",
};

export default function PressableButton({
  children,
  variant = "neutral",
  state = "default",
  active = false,
  fullWidth = false,
  disabled = false,
  className,
  ...props
}: PressableButtonProps) {
  const colorClasses =
    state !== "default"
      ? STATE_CLASSES[state]
      : active
        ? "border-primary-600 bg-primary-100 text-primary-800"
        : VARIANT_CLASSES[variant];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 520, damping: 30 }}
      className={cn(
        "rounded-2xl border-[3px] px-5 py-3 text-left font-display font-semibold shadow-[4px_4px_0_0_var(--color-ink)]",
        "transition-[transform,box-shadow,background-color,color,border-color]",
        "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0_0_var(--color-ink)]",
        colorClasses,
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
