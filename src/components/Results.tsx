import { useMemo, useState } from "react";
import type { Answer, Exam, Question, SessionMode } from "../types";
import { scoreSession, formatDuration, type Flags, type Responses } from "../lib/session";
import QuestionView from "./QuestionView";

type Filter = "all" | "incorrect" | "unanswered" | "flagged";
export default function Results({ exam, questions, responses, flags, mode, timeTaken, onRetry, onRestart, onSetup, onExit }: { exam: Exam; questions: Question[]; responses: Responses; flags: Flags; mode: SessionMode; timeTaken: number; onRetry: (questions: Question[]) => void; onRestart: () => void; onSetup: () => void; onExit: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const score = scoreSession(questions, responses);
  const filtered = useMemo(() => questions.filter((question) => filter === "all" || filter === "flagged" && flags[question.number] || filter === "unanswered" && !responses[question.number] || filter === "incorrect" && responses[question.number] && responses[question.number] !== question.answer), [filter, questions, responses, flags]);
  const retryable = questions.filter((question) => !responses[question.number] || responses[question.number] !== question.answer);
  return <section className="workspace results"><span className="eyebrow">SESSION COMPLETE</span><h1>Review your session.</h1><p className="muted">{mode === "practice" ? "Practice accuracy" : "Exam review"} · {questions.length} questions · Time taken {formatDuration(timeTaken)}</p>
    <div className="results-summary"><div><strong>{score.accuracy}%</strong><span>Accuracy</span></div><div><strong>{score.correct}</strong><span>Correct</span></div><div><strong>{score.incorrect}</strong><span>Incorrect</span></div><div><strong>{score.unanswered}</strong><span>Unanswered</span></div></div>
    <p className="notice">This is practice accuracy across every question in this session, including unanswered questions. It is not an official PhilNITS exam score.</p>
    <div className="actions centered"><button className="primary" disabled={!retryable.length} onClick={() => onRetry(retryable)}>Retry incorrect/unanswered ({retryable.length})</button><button onClick={onRestart}>Restart same set</button><button onClick={onSetup}>Change setup</button><button onClick={onExit}>New exam</button></div>
    <div className="filter-tabs" role="group" aria-label="Filter results">{(["all", "incorrect", "unanswered", "flagged"] as Filter[]).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)} ({value === "all" ? questions.length : value === "incorrect" ? score.incorrect : value === "unanswered" ? score.unanswered : questions.filter((q) => flags[q.number]).length})</button>)}</div>
    <div className="result-list">{filtered.length ? filtered.map((question) => { const answer = responses[question.number]; return <details className="result-item" key={question.number}><summary><strong>Q{question.number}</strong><span>Your answer: {answer ?? "Unanswered"}</span><span className={answer === question.answer ? "good" : "bad"}>{answer === question.answer ? "Correct" : `Correct answer: ${question.answer}`}</span></summary><div className="result-detail"><p className="small muted">Original PDF crop · Your answer: <strong>{answer ?? "Unanswered"}</strong> · Correct answer: <strong>{question.answer}</strong></p><QuestionView exam={exam} question={question} /></div></details>; }) : <p className="empty-results">No questions match this filter.</p>}</div>
  </section>;
}
