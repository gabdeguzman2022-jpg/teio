"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";

interface ConfettiBurstProps {
  trigger: number;
  intensity?: "burst" | "big";
}

const BRAND_COLORS = ["#3860ec", "#fa8f0c", "#ffd685", "#22b562"];

export default function ConfettiBurst({ trigger, intensity = "burst" }: ConfettiBurstProps) {
  const isFirstRender = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reducedMotion) return;

    if (intensity === "big") {
      confetti({ particleCount: 90, spread: 95, startVelocity: 42, origin: { y: 0.55 }, colors: BRAND_COLORS });
      confetti({
        particleCount: 45,
        spread: 120,
        startVelocity: 55,
        origin: { x: 0.2, y: 0.6 },
        angle: 60,
        colors: BRAND_COLORS,
      });
      confetti({
        particleCount: 45,
        spread: 120,
        startVelocity: 55,
        origin: { x: 0.8, y: 0.6 },
        angle: 120,
        colors: BRAND_COLORS,
      });
    } else {
      confetti({ particleCount: 55, spread: 65, startVelocity: 32, origin: { y: 0.65 }, colors: BRAND_COLORS });
    }
  }, [trigger, intensity, reducedMotion]);

  return null;
}
