"use client";

import { useRouter } from "next/navigation";
import { SkillTree } from "@/components/SkillTree";
import type { Lesson, Subject, UserProgress } from "@/lib/types";

interface SubjectSkillTreeProps {
  subject: Subject;
  lessons: Lesson[];
  progress: UserProgress[];
}

export function SubjectSkillTree({ subject, lessons, progress }: SubjectSkillTreeProps) {
  const router = useRouter();

  return (
    <SkillTree
      subject={subject}
      lessons={lessons}
      progress={progress}
      onSelectLesson={(lessonId) => router.push(`/lesson/${lessonId}`)}
    />
  );
}
