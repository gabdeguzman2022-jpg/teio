import { notFound } from "next/navigation";
import LessonRunner from "@/components/LessonRunner";
import { getLessonById } from "@/content";
import { getProgress } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const lesson = getLessonById(id);
  if (!lesson) notFound();

  const { profile } = getProgress();
  const { tier, ...gamification } = profile;

  return <LessonRunner lesson={lesson} initialTier={tier} initialGamification={gamification} />;
}
