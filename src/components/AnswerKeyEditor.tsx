import { useMemo, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import type { Answer, Exam } from "../types";
import { answerKeyLimitation, generateAnswerKeyDraft, getQuestionChoices, getQuestionPrompt, type AnswerKeyDraft } from "../lib/answerKey";
import { downloadAnswerKeyPdf } from "../lib/answerKeyPdf";

export default function AnswerKeyEditor({ exam, onSave, onBack }: { exam: Exam; onSave: (exam: Exam) => void; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<number, Answer | undefined>>(() => Object.fromEntries(exam.questions.map((question) => [question.number, question.answer])));
  const [drafts, setDrafts] = useState<Record<number, AnswerKeyDraft>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const unresolved = useMemo(() => exam.questions.filter((question) => !answers[question.number]), [exam.questions, answers]);

  function choose(questionNumber: number, answer: string) {
    setAnswers({ ...answers, [questionNumber]: answer === "" ? undefined : answer as Answer });
    setDrafts({ ...drafts, [questionNumber]: { questionId: questionNumber, answer: answer === "" ? undefined : answer as Answer, source: "manual" } });
  }
  async function generate() {
    setBusy(true); setErrors([]); setProgress("Preparing bounded batches…");
    try {
      const result = await generateAnswerKeyDraft(exam.questions, (completed, total, message) => setProgress(`${message} (${completed}/${total})`));
      const nextAnswers = { ...answers };
      const nextDrafts = { ...drafts };
      for (const item of result.items) {
        nextDrafts[item.questionId] = item;
        if (item.answer) nextAnswers[item.questionId] = item.answer;
      }
      setAnswers(nextAnswers); setDrafts(nextDrafts); setErrors(result.errors); setProgress(result.errors.length ? "Draft finished with items requiring review." : "Draft finished — review every proposed answer before saving.");
    } catch (error) { setErrors([(error as Error).message]); setProgress(""); }
    finally { setBusy(false); }
  }
  function save() { onSave({ ...exam, questions: exam.questions.map((question) => ({ ...question, answer: answers[question.number] })) }); }
  return <section className="workspace answer-key-editor"><div className="section-title"><div><span className="eyebrow">ANSWER KEY WORKSPACE</span><h1>Build a reviewed answer key.</h1><p>Keep original question numbers intact. Unresolved questions stay unresolved until you choose an answer.</p></div><button onClick={onBack}>Discard import</button></div>
    <div className="answer-key-toolbar"><div className="answer-key-summary"><strong>{unresolved.length}</strong> unresolved of {exam.questions.length}</div><label className="answer-key-tag"><span>Optional tag</span><input value={tag} maxLength={40} placeholder="e.g. Midterm, reviewed" onChange={(event) => setTag(event.target.value)} /></label><div className="answer-key-toolbar-actions"><button type="button" onClick={generate} disabled={busy}><Sparkles size={16} /> {busy ? "Generating draft…" : "Generate AI answer-key draft"}</button><button type="button" onClick={() => downloadAnswerKeyPdf({ ...exam, questions: exam.questions.map((question) => ({ ...question, answer: answers[question.number] })) }, drafts, tag.trim())}><Download size={16} /> Export answer-key PDF</button></div></div>
    <div className="notice">Manual answers are always available. AI suggestions are labeled <strong>AI-generated — review before use</strong>; ambiguous, visual, or unreadable questions remain unresolved.</div>
    {progress && <p className="answer-key-progress" role="status"><span className={busy ? "spinner" : ""} />{progress}</p>}
    {errors.length > 0 && <div className="error" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
    <div className="answer-key-list">{exam.questions.map((question) => { const choices = getQuestionChoices(question); const draft = drafts[question.number]; const limitation = answerKeyLimitation(question); return <article className={`answer-key-row ${!answers[question.number] ? "unresolved" : ""}`} key={question.number}><div className="answer-key-question"><strong>Q{question.number}</strong><p>{getQuestionPrompt(question) || question.text.slice(0, 180)}</p>{limitation && <span className="review-reason">Review limitation: {limitation}</span>}</div><div className="answer-key-control"><select aria-label={`Correct answer for question ${question.number}`} value={answers[question.number] ?? ""} onChange={(e) => choose(question.number, e.target.value)}><option value="">Unresolved</option>{choices.map((choice) => <option value={choice.label} key={choice.label}>{choice.label}) {choice.text.slice(0, 90)}</option>)}</select>{draft?.source === "ai" && <span className="ai-badge">AI-generated — review before use</span>}{draft?.explanation && <details className="draft-explanation"><summary>Draft reasoning</summary><p>{draft.explanation}</p></details>}</div></article>; })}</div>
    <div className="actions"><button onClick={onBack}>Cancel</button><button className="primary" onClick={save}>Save answer key{unresolved.length ? " with unresolved questions" : " and continue"}</button></div>
  </section>;
}
