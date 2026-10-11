import test from "node:test";
import assert from "node:assert/strict";
import { prepareExplanation } from "../src/lib/explanations";
import type { Question } from "../src/types";

const question = (text: string): Question => ({ number: 7, text, segments: [], answer: "B" });

test("explanation payload preparation contains only the prompt and four choices", () => {
  const prepared = prepareExplanation(question("Q7. Which value is correct? a) One b) Two c) Three d) Four"), "A");
  assert.deepEqual(prepared, {
    input: {
      question: "Which value is correct?",
      choices: "A) One\nB) Two\nC) Three\nD) Four",
      correctAnswer: "B",
      selectedAnswer: "A",
    },
  });
});

test("diagram questions are declined before a request can be made", () => {
  const prepared = prepareExplanation(question("Q7. Refer to the diagram shown below. a) One b) Two c) Three d) Four"), "A");
  assert.match(prepared.limitation ?? "", /diagram|visual/i);
});
