import { useState } from "react";
import type { Exam } from "../types";
import QuestionView from "./QuestionView";
export default function ImportPreview({
  exam,
  onStart,
  onBack,
  onEditAnswerKey,
}: {
  exam: Exam;
  onStart: () => void;
  onBack: () => void;
  onEditAnswerKey: () => void;
}) {
  const [index, setIndex] = useState(0);
  return (
    <section className="workspace">
      <div className="section-title">
        <div>
          <span className="eyebrow">IMPORT PREVIEW</span>
          <h1>Your practice cards are ready.</h1>
          <p>
            {exam.title} · {exam.questions.length} questions with matching
            answers
          </p>
        </div>
      </div>
      <div className="notice">
        Check that the question and all four choices are visible. Extraction is
        automatic and may vary between papers.
      </div>
      <div className="toolbar">
        <label>
          Preview question{" "}
          <select
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          >
            {exam.questions.map((q, i) => (
              <option key={q.number} value={i}>
                Q{q.number}
              </option>
            ))}
          </select>
        </label>
        <span>
          Detected answer: <strong>{exam.questions[index].answer ?? "Unresolved"}</strong>
        </span>
      </div>
      <QuestionView exam={exam} question={exam.questions[index]} />
      {exam.questions.some((question) => !question.answer) && <div className="notice unresolved-notice">This import has unresolved answers. Add them manually or generate a reviewable AI draft before starting a scored session.</div>}
      <div className="actions">
        <button onClick={onBack}>Change files</button>
        <button onClick={onEditAnswerKey}>Edit answer key</button>
        <button className="primary" onClick={onStart}>
          Continue to setup
        </button>
      </div>
    </section>
  );
}
