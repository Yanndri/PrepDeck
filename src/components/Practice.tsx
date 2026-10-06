import { useState } from "react";
import { ANSWERS, type Answer, type Exam } from "../types";
import QuestionView from "./QuestionView";
import Results from "./Results";
export default function Practice({
  exam,
  onExit,
}: {
  exam: Exam;
  onExit: () => void;
}) {
  const [order, setOrder] = useState(exam.questions);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, Answer>>({});
  const [selected, setSelected] = useState<Answer>();
  const [done, setDone] = useState(false);
  const q = order[index];
  const checked = responses[q.number];
  if (done)
    return (
      <Results
        questions={order}
        responses={responses}
        onExit={onExit}
        onRetry={(questions) => {
          setOrder(questions);
          setIndex(0);
          setResponses({});
          setSelected(undefined);
          setDone(false);
        }}
      />
    );
  return (
    <section className="workspace">
      <div className="section-title">
        <div>
          <span className="eyebrow">PRACTICE SESSION</span>
          <h1>One question at a time.</h1>
          <p>{exam.title}</p>
        </div>
        <button
          onClick={() => {
            if (
              window.confirm("End this session and return to file selection?")
            )
              onExit();
          }}
        >
          Exit session
        </button>
      </div>
      <div className="toolbar">
        <strong>
          Question {index + 1} of {order.length}
        </strong>
        <span>{Object.values(responses).length} answered</span>
      </div>
      <progress max={order.length} value={Object.values(responses).length} />
      <article className="practice-card">
        <div className="card-meta">
          {exam.source} · Q{q.number}
        </div>
        <QuestionView exam={exam} question={q} />
        <div className="choices" role="group" aria-label="Choose your answer">
          {ANSWERS.map((a) => (
            <button
              key={a}
              aria-pressed={(checked ?? selected) === a}
              disabled={!!checked}
              onClick={() => setSelected(a)}
              className={
                checked
                  ? a === q.answer
                    ? "correct"
                    : a === checked
                      ? "incorrect"
                      : ""
                  : selected === a
                    ? "selected"
                    : ""
              }
            >
              {a}
              {checked && a === q.answer ? " ✓" : ""}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          {checked && (
            <p
              className={"feedback " + (checked === q.answer ? "good" : "bad")}
            >
              {checked === q.answer
                ? "Correct!"
                : `Not quite. The correct answer is ${q.answer}.`}
            </p>
          )}
        </div>
        <div className="actions">
          <span className="small muted">
            Choose the letter shown in the original PDF.
          </span>
          {checked ? (
            <button
              className="primary"
              onClick={() => {
                if (index === order.length - 1) setDone(true);
                else {
                  setIndex(index + 1);
                  setSelected(undefined);
                }
              }}
            >
              {index === order.length - 1 ? "View results" : "Next question"}
            </button>
          ) : (
            <button
              className="primary"
              disabled={!selected}
              onClick={() => {
                if (selected)
                  setResponses({ ...responses, [q.number]: selected });
              }}
            >
              Check answer
            </button>
          )}
        </div>
      </article>
    </section>
  );
}
