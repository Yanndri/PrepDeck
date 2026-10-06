import type { Answer, Question, SessionScore, SessionSetup } from "../types";

export type Responses = Record<number, Answer | undefined>;
export type Flags = Record<number, boolean | undefined>;
export type NavigationState = "current" | "answered" | "unanswered" | "flagged";

export function createSessionOrder(
  questions: Question[],
  setup: Pick<SessionSetup, "questionCount" | "shuffle">,
  random: () => number = Math.random,
): Question[] {
  const count = Math.max(1, Math.min(setup.questionCount, questions.length));
  const pool = [...questions];
  if (setup.shuffle) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return pool.slice(0, count);
}

export function scoreSession(questions: Question[], responses: Responses): SessionScore {
  let correct = 0;
  let unanswered = 0;
  for (const question of questions) {
    const response = responses[question.number];
    if (!response) unanswered++;
    else if (response === question.answer) correct++;
  }
  const incorrect = questions.length - correct - unanswered;
  return {
    correct,
    incorrect,
    unanswered,
    accuracy: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  };
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function unansweredCount(questions: Question[], responses: Responses): number {
  return questions.filter((question) => !responses[question.number]).length;
}

export function isFlagged(flags: Flags, question: Question): boolean {
  return flags[question.number] === true;
}

export function navigationStates(
  questions: Question[],
  currentIndex: number,
  responses: Responses,
  flags: Flags,
): NavigationState[] {
  return questions.map((question, index) => {
    if (index === currentIndex) return "current";
    if (flags[question.number]) return "flagged";
    return responses[question.number] ? "answered" : "unanswered";
  });
}

export function remainingMilliseconds(endTimestamp: number, now = Date.now()): number {
  return Math.max(0, endTimestamp - now);
}

export function timerExpired(endTimestamp: number, now = Date.now()): boolean {
  return now >= endTimestamp;
}
