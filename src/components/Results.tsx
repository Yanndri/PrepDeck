import type { Answer, Question } from "../types";
export default function Results({
  questions,
  responses,
  onRetry,
  onExit,
}: {
  questions: Question[];
  responses: Record<number, Answer>;
  onRetry: (questions: Question[]) => void;
  onExit: () => void;
}) {
  const missed = questions.filter((q) => responses[q.number] !== q.answer);
  const score = questions.length - missed.length;
  return (
    <section className="workspace results">
      <span className="eyebrow">SESSION COMPLETE</span>
      <h1>Keep the momentum going.</h1>
      <div className="score">
        {Math.round((score / questions.length) * 100)}
        <span>%</span>
      </div>
      <p>
        {score} correct out of {questions.length} questions
      </p>
      <p className="muted small">
        Practice accuracy, not an official PhilNITS exam score.
      </p>
      <div className="actions centered">
        {!!missed.length && (
          <button className="primary" onClick={() => onRetry(missed)}>
            Retry {missed.length} mistakes
          </button>
        )}
        <button onClick={() => onRetry(questions)}>Practice again</button>
        <button onClick={onExit}>New exam</button>
      </div>
      <div className="result-list">
        {questions.map((q) => (
          <div key={q.number}>
            <strong>Q{q.number}</strong>
            <span>Your answer: {responses[q.number]}</span>
            <span className={responses[q.number] === q.answer ? "good" : "bad"}>
              {responses[q.number] === q.answer
                ? "Correct"
                : `Correct answer: ${q.answer}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
