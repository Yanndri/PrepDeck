import test from "node:test";
import assert from "node:assert/strict";
import { createSessionOrder, navigationStates, remainingMilliseconds, scoreSession, timerExpired } from "../src/lib/session";
import type { Question } from "../src/types";

const questions: Question[] = [
  { number: 1, text: "one", segments: [], answer: "A" },
  { number: 2, text: "two", segments: [], answer: "B" },
  { number: 3, text: "three", segments: [], answer: "C" },
  { number: 4, text: "four", segments: [], answer: "D" },
];

test("shuffled subset has no duplicates and keeps original question IDs", () => {
  const session = createSessionOrder(questions, { questionCount: 3, shuffle: true }, () => 0.1);
  assert.equal(session.length, 3);
  assert.equal(new Set(session.map((q) => q.number)).size, 3);
  assert.deepEqual(session.map((q) => q.number), [2, 3, 4]);
});

test("scoring uses stable original IDs, including unanswered questions", () => {
  const shuffled = [questions[2], questions[0], questions[3]];
  const score = scoreSession(shuffled, { 1: "A", 3: "A" });
  assert.deepEqual(score, { correct: 1, incorrect: 1, unanswered: 1, accuracy: 33 });
});

test("navigation states distinguish current, answered, unanswered and flagged", () => {
  assert.deepEqual(navigationStates(questions, 1, { 1: "A" }, { 3: true }), ["answered", "current", "flagged", "unanswered"]);
});

test("timer is based on end timestamp and expires while time is unchanged by tab switching", () => {
  const end = 10_000;
  assert.equal(remainingMilliseconds(end, 7_500), 2_500);
  assert.equal(timerExpired(end, 9_999), false);
  assert.equal(timerExpired(end, 10_000), true);
  assert.equal(remainingMilliseconds(end, 20_000), 0);
});
