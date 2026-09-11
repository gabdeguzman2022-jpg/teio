import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OllamaUnavailableError,
  isTutorReady,
  streamTutorReply,
  type TutorChatMessage,
} from "@/lib/ai/ollama";
import { db, ensureLocalProfile } from "@/lib/db/client";
import { aiMessageLog, profile } from "@/lib/db/schema";
import { canUseAiTutor } from "@/lib/gamification/tiers";
import { TIER_LIMITS, type Tier } from "@/lib/types";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const reachable = await isTutorReady();
  return NextResponse.json({ reachable });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Malformed request body." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", message: "Expected a non-empty list of chat messages." },
      { status: 400 },
    );
  }

  const messages: TutorChatMessage[] = parsed.data.messages;
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "invalid_request", message: "The last message must come from the student." },
      { status: 400 },
    );
  }

  ensureLocalProfile();
  const [profileRow] = await db.select().from(profile).limit(1);
  if (!profileRow) {
    return NextResponse.json(
      { error: "server_error", message: "No local profile found." },
      { status: 500 },
    );
  }

  const tier = profileRow.tier as Tier;
  const today = todayISODate();
  const [usageRow] = await db
    .select()
    .from(aiMessageLog)
    .where(and(eq(aiMessageLog.profileId, profileRow.id), eq(aiMessageLog.dateISO, today)))
    .limit(1);
  const usedToday = usageRow?.count ?? 0;

  if (!canUseAiTutor(tier, usedToday)) {
    const limit = TIER_LIMITS[tier].aiMessagesPerDay;
    return NextResponse.json(
      {
        error: "tier_limit_reached",
        message:
          limit === null
            ? "You've reached today's AI tutor limit."
            : `You've used all ${limit} AI tutor messages for today on the ${tier} plan. Come back tomorrow, or keep working through the lesson in the meantime.`,
      },
      { status: 429 },
    );
  }

  const reachable = await isTutorReady();
  if (!reachable) {
    return NextResponse.json(
      {
        error: "ollama_unavailable",
        message:
          "The AI tutor isn't running. Start Ollama, then run `ollama pull qwen2.5:3b-instruct` if you haven't already.",
      },
      { status: 503 },
    );
  }

  if (usageRow) {
    await db
      .update(aiMessageLog)
      .set({ count: usedToday + 1 })
      .where(eq(aiMessageLog.id, usageRow.id));
  } else {
    await db.insert(aiMessageLog).values({
      id: randomUUID(),
      profileId: profileRow.id,
      dateISO: today,
      count: 1,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of streamTutorReply(messages)) {
          controller.enqueue(encoder.encode(token));
        }
      } catch (error) {
        const fallback =
          error instanceof OllamaUnavailableError
            ? "\n\n_The tutor connection was lost. Make sure Ollama is still running._"
            : "\n\n_Something went wrong while talking to the tutor._";
        controller.enqueue(encoder.encode(fallback));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
