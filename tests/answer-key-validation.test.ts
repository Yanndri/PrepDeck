import test from "node:test";
import assert from "node:assert/strict";
import { validateDraftResponse } from "../src/lib/answerKey";
import type { Question } from "../src/types";

const questions: Question[] = [{ number: 3, text: "Q3. Pick one. a) First b) Second c) Third d) Fourth", segments: [], answer: undefined }];

test("AI answer-key validation preserves IDs and rejects answers outside actual choices", () => {
  const valid = validateDraftResponse({ answers: [{ questionId: 3, answer: "B", explanation: "The supplied text supports B.", ambiguous: false }] }, questions);
  assert.equal(valid[0].questionId, 3);
  assert.equal(valid[0].answer, "B");
  const invalid = validateDraftResponse({ answers: [{ questionId: 3, answer: "E", explanation: "", ambiguous: false }] }, questions);
  assert.equal(invalid[0].answer, undefined);
  assert.match(invalid[0].reviewReason ?? "", /available choice/);
});
