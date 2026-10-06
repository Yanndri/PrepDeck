import test from "node:test";
import assert from "node:assert/strict";
import { parseAnswers, parseQuestions } from "../src/lib/parseExam";
import type { PageText } from "../src/types";
const page = (texts: string[], n = 1): PageText => ({
  page: n,
  height: 800,
  lines: texts.map((text, i) => ({ text, x: 40, y: 80 + i * 60, height: 12 })),
});
test("answer table pairs remain associated across columns", () => {
  const key = parseAnswers([page(["1 c 31 b", "2 a 32 d"])]);
  assert.deepEqual(
    [...key],
    [
      [1, "C"],
      [31, "B"],
      [2, "A"],
      [32, "D"],
    ],
  );
});
test("cover samples excluded and continuation pages retained", () => {
  const pages = [
    page(["Sample Question", "Q1. Example"], 1),
    page(["Q1. Real question", "a) Option"], 2),
    page(["continued choices", "Q2. Second question"], 3),
  ];
  const qs = parseQuestions(
    pages,
    new Map([
      [1, "A"],
      [2, "B"],
    ]),
  );
  assert.equal(qs.length, 2);
  assert.equal(qs[0].segments.length, 2);
  assert.equal(qs[0].segments[0].page, 2);
});
test("missing answer cannot silently change scoring", () => {
  assert.throws(
    () =>
      parseQuestions([page(["Q1. First", "Q2. Second"])], new Map([[1, "A"]])),
    /do not match/,
  );
});
test("conflicting keys are rejected", () => {
  assert.throws(() => parseAnswers([page(["1 a", "1 b"])]), /Conflicting/);
});
