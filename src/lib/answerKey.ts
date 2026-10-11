import type { Answer, Exam, Question } from "../types";

export interface Choice { label: Answer; text: string; }
export interface AnswerKeyDraft {
  questionId: number;
  answer?: Answer;
  explanation?: string;
  reviewReason?: string;
  source?: "ai" | "manual";
}

const answerMarker = /(?:^|\s)([A-Da-d])(?:[.)\]:])\s+/g;
const visualReference = /\b(?:diagram|figure|illustration|flowchart|schematic|graph|chart)\b|\bshown\s+(?:below|above)\b|\bas\s+shown\b|\brefer\s+to\s+(?:the\s+)?(?:figure|diagram|image)\b/i;
const BATCH_SIZE = 8;

export function getQuestionChoices(question: Question): Choice[] {
  const matches = [...question.text.matchAll(answerMarker)];
  if (matches.length !== 4) return [];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? question.text.length : question.text.length;
    return { label: match[1].toUpperCase() as Answer, text: question.text.slice(start, end).trim() };
  });
}

export function getQuestionPrompt(question: Question): string {
  const firstChoice = question.text.search(answerMarker);
  return question.text.slice(0, firstChoice >= 0 ? firstChoice : question.text.length).replace(/^Q(?:uestion)?\s*\d{1,3}\s*[.．):]?\s*/i, "").trim();
}

export function answerKeyLimitation(question: Question): string | undefined {
  if (visualReference.test(question.text)) return "References a diagram or other visual material.";
  if (getQuestionChoices(question).length !== 4) return "Could not extract all four answer choices.";
  if (!getQuestionPrompt(question)) return "Could not extract the question text.";
  return undefined;
}

export function updateExamAnswers(exam: Exam, answers: Record<number, Answer | undefined>): Exam {
  return { ...exam, questions: exam.questions.map((question) => ({ ...question, answer: answers[question.number] })) };
}

export function unresolvedQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => !question.answer);
}

export function validateDraft(question: Question, answer: unknown): Answer | undefined {
  const choices = getQuestionChoices(question).map((choice) => choice.label);
  return typeof answer === "string" && choices.includes(answer.toUpperCase() as Answer) ? answer.toUpperCase() as Answer : undefined;
}

export async function generateAnswerKeyDraft(questions: Question[], onProgress?: (completed: number, total: number, message: string) => void): Promise<{ items: AnswerKeyDraft[]; errors: string[] }> {
  const endpoint = import.meta.env.VITE_ANSWER_KEY_API_URL?.trim();
  if (!endpoint) throw new Error("AI answer-key generation is not configured. Enter answers manually or set VITE_ANSWER_KEY_API_URL.");
  const items: AnswerKeyDraft[] = [];
  const errors: string[] = [];
  const supported = questions.filter((question) => !answerKeyLimitation(question));
  const unsupported = questions.filter((question) => answerKeyLimitation(question));
  items.push(...unsupported.map((question) => ({ questionId: question.number, reviewReason: answerKeyLimitation(question) })));
  for (let start = 0; start < supported.length; start += BATCH_SIZE) {
    const batch = supported.slice(start, start + BATCH_SIZE);
    const payload = { questions: batch.map((question) => ({ id: question.number, question: getQuestionPrompt(question), choices: getQuestionChoices(question).map((choice) => `${choice.label}) ${choice.text}`) })) };
    let response: AnswerKeyDraft[] | undefined;
    let lastError = "";
    for (let attempt = 1; attempt <= 2 && !response; attempt++) {
      try {
        const result = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!result.ok) throw new Error(`Answer-key service returned ${result.status}.`);
        const body: unknown = await result.json();
        response = validateDraftResponse(body, batch);
      } catch (error) {
        lastError = (error as Error).message || "Could not generate this batch.";
      }
    }
    if (response) items.push(...response);
    else {
      errors.push(`Questions ${batch[0].number}–${batch[batch.length - 1].number}: ${lastError || "Invalid answer-key response."}`);
      items.push(...batch.map((question) => ({ questionId: question.number, reviewReason: "Generation failed for this batch; enter the answer manually." })));
    }
    onProgress?.(Math.min(start + BATCH_SIZE, supported.length), supported.length, `Processed ${Math.min(start + BATCH_SIZE, supported.length)} of ${supported.length} questions.`);
  }
  return { items, errors };
}

export function validateDraftResponse(body: unknown, questions: Question[]): AnswerKeyDraft[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { answers?: unknown }).answers)) throw new Error("The answer-key service returned an invalid response.");
  const raw = (body as { answers: unknown[] }).answers;
  const byId = new Map(questions.map((question) => [question.number, question]));
  return questions.map((question) => {
    const item = raw.find((candidate) => candidate && typeof candidate === "object" && (candidate as { questionId?: unknown }).questionId === question.number) as { answer?: unknown; explanation?: unknown; ambiguous?: unknown } | undefined;
    const answer = validateDraft(question, item?.answer);
    return { questionId: question.number, answer, explanation: typeof item?.explanation === "string" ? item.explanation : undefined, reviewReason: answer ? item?.ambiguous ? "Marked ambiguous by the model; review before use." : undefined : "The proposed answer did not match an available choice.", source: "ai" as const };
  }).filter((item) => byId.has(item.questionId));
}
