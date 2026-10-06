import { useState } from "react";
import type { Exam, SessionMode, SessionSetup } from "../types";

export default function Setup({ exam, onStart, onBack }: { exam: Exam; onStart: (setup: SessionSetup) => void; onBack: () => void }) {
  const [mode, setMode] = useState<SessionMode>("practice");
  const [count, setCount] = useState(exam.questions.length);
  const [shuffle, setShuffle] = useState(false);
  const [timer, setTimer] = useState(0);
  const presets = [10, 25, 50].filter((value) => value < exam.questions.length);
  return <section className="workspace setup-screen">
    <div className="section-title"><div><span className="eyebrow">SESSION SETUP</span><h1>Choose how you want to study.</h1><p>{exam.title} · {exam.questions.length} imported questions</p></div><button onClick={onBack}>Change files</button></div>
    <div className="mode-grid">
      <button className={`mode-card ${mode === "practice" ? "selected" : ""}`} onClick={() => setMode("practice")} aria-pressed={mode === "practice"}><strong>Practice mode</strong><span>Check each answer immediately and see feedback. Checked answers lock.</span></button>
      <button className={`mode-card ${mode === "exam" ? "selected" : ""}`} onClick={() => setMode("exam")} aria-pressed={mode === "exam"}><strong>Exam mode</strong><span>Move freely and submit once. Correctness stays hidden until the end.</span></button>
    </div>
    <div className="setup-options">
      <label><span>Questions</span><select value={count} onChange={(e) => setCount(Number(e.target.value))}><option value={exam.questions.length}>All {exam.questions.length} questions</option>{presets.map((value) => <option key={value} value={value}>{value} questions</option>)}</select></label>
      <label className="checkbox-row"><input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} /> Shuffle question order</label>
      {mode === "exam" && <label><span>Optional timer</span><select value={timer} onChange={(e) => setTimer(Number(e.target.value))}><option value={0}>No timer</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>60 minutes</option></select></label>}
    </div>
    <div className="notice">{mode === "practice" ? "Practice accuracy is calculated across the selected questions, including anything you leave unanswered." : "Exam mode hides correctness and scores until submission. The timer uses a fixed end time and keeps running if you switch tabs."}</div>
    <div className="actions"><button onClick={onBack}>Back to preview</button><button className="primary" onClick={() => onStart({ mode, questionCount: count, shuffle, timerMinutes: timer || undefined })}>Start {mode}</button></div>
  </section>;
}
