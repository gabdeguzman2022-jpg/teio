import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SubjectSkillTree } from "@/components/SubjectSkillTree";
import { getLessonsForSubject } from "@/content";
import { getProgress } from "@/lib/db/queries";
import type { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "science", "technology", "engineering"];

function isSubject(value: string): value is Subject {
  return (SUBJECTS as string[]).includes(value);
}

interface SubjectPageProps {
  params: Promise<{ subject: string }>;
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subject: subjectParam } = await params;
  if (!isSubject(subjectParam)) notFound();

  const { profile, lessons: progress } = getProgress();
  const { tier, ...gamification } = profile;
  const lessons = getLessonsForSubject(subjectParam);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav gamification={gamification} tier={tier} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Back to subjects
        </Link>
        <SubjectSkillTree subject={subjectParam} lessons={lessons} progress={progress} />
      </main>
    </div>
  );
}
