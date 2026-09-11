import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getProgress,
  saveProgress,
  InvalidProgressError,
  type LocalProfile,
  type ProgressBundle,
} from "@/lib/db/queries";

// JSON has no Infinity; unlimited hearts serialize as null, mirroring how
// TierLimits.aiMessagesPerDay already uses null for "unlimited" in types.ts.
function serializeBundle(bundle: ProgressBundle) {
  const { hearts, maxHearts, ...rest } = bundle.profile satisfies LocalProfile;
  return {
    profile: {
      ...rest,
      hearts: Number.isFinite(hearts) ? hearts : null,
      maxHearts: Number.isFinite(maxHearts) ? maxHearts : null,
    },
    lessons: bundle.lessons,
    newlyUnlockedBadgeIds: bundle.newlyUnlockedBadgeIds,
  };
}

export async function GET() {
  try {
    return NextResponse.json(serializeBundle(getProgress()));
  } catch (err) {
    return NextResponse.json(
      { error: "server_error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

const saveProgressSchema = z
  .object({
    lessonId: z.string().min(1),
    subject: z.enum(["math", "science", "technology", "engineering"]),
    // Omitted entirely for a lesson-completion-only save that shouldn't also
    // award XP or dock a heart (see SaveProgressInput in db/queries.ts).
    // No xpAward field: the amount per correct answer is a fixed server-side
    // constant (see saveProgress), never taken from the request body.
    correct: z.boolean().optional(),
    completeLesson: z.boolean().optional(),
    scorePercent: z.number().min(0).max(100).optional(),
  })
  .refine((body) => !body.completeLesson || body.scorePercent !== undefined, {
    message: "scorePercent is required when completeLesson is true",
    path: ["scorePercent"],
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = saveProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const bundle = saveProgress(parsed.data);
    return NextResponse.json(serializeBundle(bundle));
  } catch (err) {
    if (err instanceof InvalidProgressError) {
      return NextResponse.json({ error: "invalid_progress", message: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "server_error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
