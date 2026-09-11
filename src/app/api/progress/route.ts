import { NextResponse } from "next/server";
import { z } from "zod";
import { getProgress, saveProgress, type LocalProfile, type ProgressBundle } from "@/lib/db/queries";

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
  };
}

export async function GET() {
  return NextResponse.json(serializeBundle(getProgress()));
}

const saveProgressSchema = z
  .object({
    lessonId: z.string().min(1),
    subject: z.enum(["math", "science", "technology", "engineering"]),
    // Omitted entirely for a lesson-completion-only save that shouldn't also
    // award XP or dock a heart (see SaveProgressInput in db/queries.ts).
    correct: z.boolean().optional(),
    xpAward: z.number().int().positive().optional(),
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

  const bundle = saveProgress(parsed.data);
  return NextResponse.json(serializeBundle(bundle));
}
