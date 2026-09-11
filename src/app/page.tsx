import { Nav } from "@/components/Nav";
import { SubjectCard } from "@/components/SubjectCard";
import { LESSONS_BY_SUBJECT } from "@/content";
import { getProgress } from "@/lib/db/queries";
import type { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "science", "technology", "engineering"];

export default function Home() {
  const { profile, lessons } = getProgress();
  const { tier, ...gamification } = profile;

  const completedLessonIds = new Set(lessons.filter((l) => l.completed).map((l) => l.lessonId));
  const subjectProgress = SUBJECTS.map((subject) => {
    const subjectLessons = LESSONS_BY_SUBJECT[subject];
    return {
      subject,
      completedLessons: subjectLessons.filter((l) => completedLessonIds.has(l.id)).length,
      totalLessons: subjectLessons.length,
    };
  });
  const totalCompleted = subjectProgress.reduce((sum, s) => sum + s.completedLessons, 0);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav gamification={gamification} tier={tier} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-3 rounded-[28px] border-[3px] border-ink bg-primary-600 px-6 py-7 text-white shadow-[6px_6px_0_0_var(--color-ink)] sm:px-8">
          <span className="w-fit rounded-full border-2 border-white/40 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {gamification.streakDays} day streak
          </span>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Welcome back to Teio</h1>
          <p className="max-w-xl text-white/80">
            {totalCompleted} lessons done so far. Pick a subject below and keep the streak alive.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold text-ink">Your subjects</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjectProgress.map((s) => (
              <SubjectCard
                key={s.subject}
                subject={s.subject}
                completedLessons={s.completedLessons}
                totalLessons={s.totalLessons}
                href={`/subjects/${s.subject}`}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
