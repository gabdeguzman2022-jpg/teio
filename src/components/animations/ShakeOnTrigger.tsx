"use client";

import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

interface ShakeOnTriggerProps {
  trigger: number;
  children: ReactNode;
  className?: string;
}

export default function ShakeOnTrigger({ trigger, children, className }: ShakeOnTriggerProps) {
  const controls = useAnimationControls();
  const isFirstRender = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reducedMotion) return;
    controls.start({
      x: [0, -9, 8, -6, 4, 0],
      transition: { duration: 0.45, ease: "easeInOut" },
    });
  }, [trigger, reducedMotion, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
}
