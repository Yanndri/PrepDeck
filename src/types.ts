import type { PDFDocumentProxy } from "pdfjs-dist";
export type Answer = "A" | "B" | "C" | "D";
export const ANSWERS: Answer[] = ["A", "B", "C", "D"];
export interface Segment {
  page: number;
  top: number;
  bottom: number;
}
export interface Question {
  number: number;
  text: string;
  segments: Segment[];
  answer: Answer;
}
export type SessionMode = "practice" | "exam";
export interface SessionSetup {
  mode: SessionMode;
  questionCount: number;
  shuffle: boolean;
  timerMinutes?: number;
}
export interface SessionScore {
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
}
export interface Exam {
  title: string;
  source: string;
  questions: Question[];
  pdf: PDFDocumentProxy;
}
export interface TextLine {
  text: string;
  x: number;
  y: number;
  height: number;
}
export interface PageText {
  page: number;
  height: number;
  lines: TextLine[];
}
