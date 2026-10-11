import test from "node:test";
import assert from "node:assert/strict";
import { answerKeyText, buildAnswerKeyPdf } from "../src/lib/answerKeyPdf";
import { parseAnswers } from "../src/lib/parseExam";
import type { Exam } from "../src/types";

const exam = { title: "Algebra Midterm", questions: [{ number: 7, text: "", segments: [], answer: "B" }, { number: 12, text: "", segments: [], answer: "D" }], source: "Algebra", pdf: {} } as Exam;

test("exported answer-key text can be parsed back by the answer-key parser", () => {
  const parsed = parseAnswers([{ page: 1, height: 800, lines: answerKeyText(exam).slice(3).map((text) => ({ text, x: 0, y: 0, height: 12 })) }]);
  assert.deepEqual([...parsed], [[7, "B"], [12, "D"]]);
});

test("answer-key PDF export includes unresolved markers and remains a PDF", () => {
  const unresolved = { ...exam, questions: [{ ...exam.questions[0], answer: undefined }, exam.questions[1]] };
  const bytes = buildAnswerKeyPdf(answerKeyText(unresolved));
  const text = new TextDecoder().decode(bytes);
  assert.equal(text.startsWith("%PDF-1.4"), true);
  assert.match(text, /UNRESOLVED/);
});

test("answer-key text includes an optional tag without changing answer lines", () => {
  const text = answerKeyText(exam, {}, "Midterm reviewed");

  assert.equal(text[1], "Tag: Midterm reviewed");
  assert.match(text.join("\n"), /Q7 B/);
  assert.match(text.join("\n"), /Q12 D/);
});
