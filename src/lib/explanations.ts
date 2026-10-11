import type { Answer, Question } from "../types";

const DEFAULT_EXPLANATION_API_URL = "https://i4kx45384f.execute-api.ap-southeast-2.amazonaws.com/explain";
const explanationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export interface ExplanationInput {
  question: string;
  choices: string;
  correctAnswer: string;
  selectedAnswer: string;
}

export type ExplanationPreparation =
  | { input: ExplanationInput; limitation?: undefined }
  | { input?: undefined; limitation: string };

const choiceMarker = /(?:^|\s)([A-Da-d])(?:[.)\]:])\s+/g;
const visualReference = /\b(?:diagram|figure|illustration|flowchart|schematic|graph|chart)\b|\bshown\s+(?:below|above)\b|\bas\s+shown\b|\brefer\s+to\s+(?:the\s+)?(?:figure|diagram|image)\b/i;

export function prepareExplanation(question: Question, selectedAnswer: Answer): ExplanationPreparation {
  if (visualReference.test(question.text)) {
    return { limitation: "This question refers to a diagram or other visual material. Explanations for visual questions are not available yet." };
  }
  const matches = [...question.text.matchAll(choiceMarker)];
  if (matches.length !== 4) {
    return { limitation: "This question’s choices could not be extracted completely, so an explanation would be incomplete." };
  }
  const choices = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? question.text.length : question.text.length;
    return `${match[1].toUpperCase()}) ${question.text.slice(start, end).trim()}`;
  });
  const firstStart = (matches[0].index ?? 0) + matches[0][0].length;
  const prompt = question.text.slice(0, matches[0].index ?? firstStart).replace(/^Q\s*\d{1,3}\s*[.．]?\s*/i, "").trim();
  if (!prompt || choices.some((choice) => choice.length <= 3)) {
    return { limitation: "This question’s text is incomplete, so an explanation would be incomplete." };
  }
  return { input: { question: prompt, choices: choices.join("\n"), correctAnswer: question.answer, selectedAnswer } };
}

export async function requestExplanation(input: ExplanationInput): Promise<string> {
  const key = JSON.stringify(input);
  const cached = explanationCache.get(key);
  if (cached) return cached;
  const pending = pendingRequests.get(key);
  if (pending) return pending;
  const endpoint = import.meta.env.VITE_EXPLANATION_API_URL?.trim() || DEFAULT_EXPLANATION_API_URL;
  const request = fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Explanation service returned ${response.status}.`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || typeof (body as { explanation?: unknown }).explanation !== "string") {
      throw new Error("The explanation service returned an invalid response.");
    }
    const explanation = (body as { explanation: string }).explanation.trim();
    if (!explanation) throw new Error("The explanation service returned an empty explanation.");
    explanationCache.set(key, explanation);
    return explanation;
  }).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
}
