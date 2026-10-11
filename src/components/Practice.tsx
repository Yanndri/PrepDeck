import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { ANSWERS, type Answer, type Exam, type Question, type SessionSetup } from "../types";
import { createSessionOrder, formatDuration, isFlagged, unansweredCount, type Flags, type Responses } from "../lib/session";
import QuestionView from "./QuestionView";
import Results from "./Results";
import ExplainMistake from "./ExplainMistake";

export default function Practice({ exam, setup, onExit, onSetup }: { exam: Exam; setup: SessionSetup; onExit: () => void; onSetup: () => void }) {
  const [order, setOrder] = useState<Question[]>(() => createSessionOrder(exam.questions, setup));
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Responses>({});
  const [responses, setResponses] = useState<Responses>({});
  const [flags, setFlags] = useState<Flags>({});
  const [done, setDone] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const startedAt = useRef(Date.now());
  const submitted = useRef(false);
  const [deadline] = useState(() => setup.mode === "exam" && setup.timerMinutes ? Date.now() + setup.timerMinutes * 60_000 : undefined);
  const [remaining, setRemaining] = useState(() => deadline ? Math.max(0, deadline - Date.now()) : 0);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const q = order[index];
  const isExam = setup.mode === "exam";
  const activeAnswers = isExam ? drafts : responses;
  const checked = responses[q.number];

  function finish() {
    if (submitted.current) return;
    submitted.current = true;
    if (isExam) setResponses({ ...drafts });
    setTimeTaken(Date.now() - startedAt.current);
    setDone(true);
  }
  useEffect(() => {
    if (!deadline || done) return;
    const tick = () => {
      const next = Math.max(0, deadline - Date.now());
      setRemaining(next);
      if (next === 0) finish();
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [deadline, done]);

  if (done) return <Results exam={exam} questions={order} responses={responses} flags={flags} mode={setup.mode} timeTaken={timeTaken} onRetry={(questions) => { submitted.current = false; setOrder(questions); setIndex(0); setDrafts({}); setResponses({}); setFlags({}); setDone(false); startedAt.current = Date.now(); }} onRestart={() => { submitted.current = false; const next = createSessionOrder(exam.questions, setup); setOrder(next); setIndex(0); setDrafts({}); setResponses({}); setFlags({}); setDone(false); setTimeTaken(0); startedAt.current = Date.now(); }} onSetup={onSetup} onExit={onExit} />;

  function choose(answer: Answer) { if (!(setup.mode === "practice" && checked)) setDrafts({ ...drafts, [q.number]: answer }); }
  function checkPractice() { const answer = drafts[q.number]; if (answer && !checked) setResponses({ ...responses, [q.number]: answer }); }
  function submitManual() {
    const unanswered = unansweredCount(order, isExam ? drafts : responses);
    const message = unanswered ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?` : "Submit this session? You will not be able to change your answers.";
    if (window.confirm(message)) finish();
  }
  function exit() { if (window.confirm("Leave this unfinished session? Your answers will be lost.")) onExit(); }
  function move(next: number) { setIndex(Math.max(0, Math.min(order.length - 1, next))); }

  return <section className="workspace practice-workspace">
    <div className="section-title"><div><span className="eyebrow">{isExam ? "EXAM MODE" : "PRACTICE MODE"}</span><h1>{isExam ? "Work through the session." : "One question at a time."}</h1><p>{exam.title} · {setup.shuffle ? "Shuffled session" : "PDF order"} · Original Q{q.number}</p></div><button onClick={exit}>Exit session</button></div>
    <div className="session-summary"><strong>Question {index + 1} of {order.length}</strong><span>{Object.keys(activeAnswers).length} answered</span>{deadline && <strong className={remaining < 60_000 ? "timer-warning" : ""} role="timer">Time {formatDuration(remaining)}</strong>}</div>
    <progress max={order.length} value={Object.keys(activeAnswers).length} aria-label="Session progress" />
    <div className="practice-layout">
      <aside className={`question-nav ${navigatorOpen ? "open" : "collapsed"}`}><button className="navigator-toggle" onClick={() => setNavigatorOpen(!navigatorOpen)} aria-expanded={navigatorOpen}>Questions <span>{navigatorOpen ? "Hide" : "Show"}</span></button>{navigatorOpen && <><div className="navigator-grid">{order.map((question, i) => { const answer = activeAnswers[question.number]; const answered = !!answer; const correct = !isExam && checkedFor(question, responses) === question.answer; return <button key={question.number} className={`nav-number ${i === index ? "current" : ""} ${answered ? "answered" : "unanswered"} ${!isExam && answered ? (correct ? "nav-correct" : "nav-incorrect") : ""} ${isFlagged(flags, question) ? "flagged" : ""}`} onClick={() => move(i)} aria-label={`Session question ${i + 1}, original question ${question.number}, ${answered ? "answered" : "unanswered"}${isFlagged(flags, question) ? ", flagged" : ""}`}>{i + 1}</button>; })}</div><div className="nav-legend"><span>Current</span><span>Answered</span><span>Flagged</span></div></>}</aside>
      <article className="practice-card">
        <div className="card-meta">{exam.source} · Original PDF Q{q.number}{setup.shuffle && <span className="session-position"> · Session position {index + 1}</span>}</div>
        <QuestionView exam={exam} question={q} />
        <div className="choices" role="group" aria-label="Choose your answer">{ANSWERS.map((a) => <button key={a} aria-pressed={(checked ?? drafts[q.number]) === a} disabled={!!checked} onClick={() => choose(a)} className={checked ? a === q.answer ? "correct" : a === checked ? "incorrect" : "" : drafts[q.number] === a ? "selected" : ""}>{a}{checked && a === q.answer ? " ✓" : ""}</button>)}</div>
        <div className="practice-feedback" aria-live="polite">{checked && <p className={checked === q.answer ? "good" : "bad"}>{checked === q.answer ? "Correct!" : `Not quite. The correct answer is ${q.answer}.`}</p>}{isExam && <p className="muted small">Correctness is hidden until you submit.</p>}</div>
        {checked && <ExplainMistake question={q} selectedAnswer={checked} />}
        <div className="actions practice-actions"><button onClick={() => setFlags({ ...flags, [q.number]: !flags[q.number] })} aria-pressed={!!flags[q.number]}><Flag size={16} /> {flags[q.number] ? "Unflag" : "Flag"}</button><button onClick={() => move(index - 1)} disabled={index === 0}>Previous</button><button onClick={() => move(index + 1)} disabled={index === order.length - 1}>Next</button>{isExam ? <button className="primary" onClick={submitManual}>Submit exam</button> : checked ? <button className="primary" onClick={() => index === order.length - 1 ? finish() : move(index + 1)}>{index === order.length - 1 ? "View results" : "Next question"}</button> : <button className="primary" disabled={!drafts[q.number]} onClick={checkPractice}>Check answer</button>}</div>
      </article>
    </div>
  </section>;
}

function checkedFor(question: Question, responses: Responses) { return responses[question.number]; }
