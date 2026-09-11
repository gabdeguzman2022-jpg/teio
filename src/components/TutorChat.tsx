"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TutorChatMessage } from "@/lib/ai/ollama";
import { cn } from "@/lib/utils";

interface ChatMessage extends TutorChatMessage {
  id: string;
}

type TutorStatus = "checking" | "available" | "unavailable";

interface TutorErrorPayload {
  error: string;
  message: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm your Teio tutor! Ask me about anything from your lessons — I'll help you think it through rather than just hand you the answer.",
};

function StatusDot({ status }: { status: TutorStatus }) {
  const color =
    status === "available"
      ? "bg-success-400"
      : status === "unavailable"
        ? "bg-danger-400"
        : "bg-accent-300";
  return (
    <span
      className={cn("ml-auto h-2.5 w-2.5 shrink-0 rounded-full", color)}
      title={`Tutor status: ${status}`}
    />
  );
}

interface TutorChatProps {
  className?: string;
}

export default function TutorChat({ className }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [tutorStatus, setTutorStatus] = useState<TutorStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tutor")
      .then((res) => res.json() as Promise<{ reachable: boolean }>)
      .then((data) => {
        if (!cancelled) setTutorStatus(data.reachable ? "available" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setTutorStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const history = [...messages.filter((m) => m.id !== "welcome"), userMessage];
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const data: TutorErrorPayload | null = await response.json().catch(() => null);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        if (response.status === 503) setTutorStatus("unavailable");
        setErrorMessage(data?.message ?? "The tutor couldn't respond right now.");
        return;
      }

      setTutorStatus("available");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response had no readable stream");
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setErrorMessage("Couldn't reach the tutor. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  const inputDisabled = isSending || tutorStatus === "unavailable";

  return (
    <div
      className={cn(
        "flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-[6px_6px_0_0_var(--color-ink)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-ink bg-primary-500 px-4 py-3">
        <Bot className="h-5 w-5 text-white" />
        <span className="font-display text-lg font-bold text-white">Teio Tutor</span>
        <StatusDot status={tutorStatus} />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "flex items-end gap-2",
                message.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink",
                  message.role === "user" ? "bg-accent-300" : "bg-primary-200",
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl border-2 border-ink px-4 py-2 text-sm leading-relaxed",
                  message.role === "user" ? "bg-accent-100" : "bg-white",
                )}
              >
                {message.content || (
                  <Loader2 className="h-4 w-4 animate-spin text-ink/40" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tutorStatus === "unavailable" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-danger-500 bg-danger-400/10 px-4 py-3 text-sm"
          >
            <p className="font-display font-bold text-danger-600">Tutor is offline</p>
            <p className="mt-1 text-ink/70">
              Teio couldn&apos;t reach Ollama on your machine. Open a terminal and run:
            </p>
            <code className="mt-2 block rounded-lg border-2 border-ink bg-white px-2 py-1 font-mono text-xs">
              ollama pull qwen2.5:3b-instruct
            </code>
            <p className="mt-2 text-ink/70">
              Then make sure Ollama is running in the background and try again.
            </p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border-2 border-danger-500 bg-danger-400/10 px-3 py-2 text-xs text-danger-600"
          >
            {errorMessage}
          </motion.p>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t-[3px] border-ink bg-white px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tutorStatus === "unavailable" ? "Tutor is offline..." : "Ask about your lesson..."}
          disabled={inputDisabled}
          className="flex-1 rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm outline-none focus:border-primary-500 disabled:opacity-50"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          type="submit"
          disabled={inputDisabled || !input.trim()}
          className="flex items-center justify-center rounded-xl border-2 border-ink bg-primary-500 px-4 py-2 text-white shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </form>
    </div>
  );
}
