const OLLAMA_HOST = "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() || "qwen2.5:3b-instruct";
const HEALTH_CHECK_TIMEOUT_MS = 2500;
const MAX_HISTORY_FOR_MODEL = 16;

export const TUTOR_SYSTEM_PROMPT = `You are the Teio Tutor, a warm, encouraging Socratic guide for a student in grades 7-12 studying math, science, technology, or engineering.

Rules you always follow:
- Never state the final answer up front. Ask a guiding question, point out what to notice, or offer one small hint at a time so the student reasons it out themselves.
- Keep replies short: 2-4 sentences, often ending in a question that moves the student forward.
- Be patient and encouraging. Praise good reasoning; when a student is wrong, gently point them back toward the idea instead of just saying "wrong."
- Use plain, age-appropriate language and explain any term you must use.
- Only give the complete answer, fully worked out, if the student clearly and explicitly asks to just be told directly (e.g. "just tell me the answer", "please solve it for me"). Even then, briefly explain why it works afterward.
- Stay focused on STEM topics appropriate for a grades 7-12 level.`;

export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface OllamaChatResponseLine {
  message?: { role: string; content: string };
  done?: boolean;
  done_reason?: string;
}

export class OllamaUnavailableError extends Error {
  constructor(message = `Ollama is not reachable at ${OLLAMA_HOST}`) {
    super(message);
    this.name = "OllamaUnavailableError";
  }
}

export function getOllamaModel(): string {
  return OLLAMA_MODEL;
}

interface OllamaTagsResponse {
  models?: { name: string; model?: string }[];
}

// Ollama being up isn't enough - the exact model tag must be pulled too, or
// /api/chat 404s. Checking both here means the "run ollama pull ..." message
// fires whenever the tutor genuinely can't respond, not just when Ollama itself
// is down.
export async function isTutorReady(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const data = (await response.json()) as OllamaTagsResponse;
    const models = data.models ?? [];
    return models.some((m) => m.name === OLLAMA_MODEL || m.model === OLLAMA_MODEL);
  } catch {
    return false;
  }
}

export async function* streamTutorReply(
  history: TutorChatMessage[],
): AsyncGenerator<string, void, unknown> {
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        messages: [
          { role: "system", content: TUTOR_SYSTEM_PROMPT },
          ...history.slice(-MAX_HISTORY_FOR_MODEL),
        ],
      }),
    });
  } catch {
    throw new OllamaUnavailableError();
  }

  if (!response.ok || !response.body) {
    throw new OllamaUnavailableError(`Ollama responded with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const consumeLine = function* (line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed: OllamaChatResponseLine;
    try {
      parsed = JSON.parse(trimmed) as OllamaChatResponseLine;
    } catch {
      return;
    }
    if (parsed.message?.content) yield parsed.message.content;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        yield* consumeLine(line);
      }
    }
    yield* consumeLine(buffer);
  } finally {
    reader.releaseLock();
  }
}
