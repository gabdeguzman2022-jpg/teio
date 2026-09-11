import type { Lesson, Subject } from "@/lib/types";
import { mathLessons } from "./math";
import { scienceLessons } from "./science";
import { technologyLessons } from "./technology";
import { engineeringLessons } from "./engineering";

export const LESSONS_BY_SUBJECT: Record<Subject, Lesson[]> = {
  math: mathLessons,
  science: scienceLessons,
  technology: technologyLessons,
  engineering: engineeringLessons,
};

export const ALL_LESSONS: Lesson[] = [
  ...mathLessons,
  ...scienceLessons,
  ...technologyLessons,
  ...engineeringLessons,
];

export function getLessonsForSubject(subject: Subject): Lesson[] {
  return [...LESSONS_BY_SUBJECT[subject]].sort((a, b) => a.order - b.order);
}

export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id);
}
