"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, X } from "lucide-react";
import TutorChat from "@/components/TutorChat";

interface TutorLauncherProps {
  canChat: boolean;
  messagesUsedToday: number;
  messageLimit: number | null;
}

export function TutorLauncher({ canChat, messagesUsedToday, messageLimit }: TutorLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI tutor" : "Open AI tutor"}
        aria-expanded={open}
        whileTap={{ scale: 0.92 }}
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-primary-500 text-white shadow-[4px_4px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-md"
          >
            {canChat ? (
              <TutorChat />
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border-[3px] border-ink bg-cream p-5 shadow-[6px_6px_0_0_var(--color-ink)]">
                <p className="font-display text-lg font-bold text-ink">Tutor limit reached</p>
                <p className="text-sm text-ink/70">
                  You&apos;ve used {messagesUsedToday}
                  {messageLimit !== null ? ` of ${messageLimit}` : ""} AI tutor messages today.
                  Come back tomorrow, or keep working through the lesson in the meantime — paying
                  tiers only add more tutor messages, never a way to skip the questions.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
