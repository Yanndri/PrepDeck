import { useState } from "react";
import { Archive, FileCheck2, FileText, ShieldCheck, Trash2 } from "lucide-react";
import { extractZip, validateFile } from "../lib/files";
import PDFThumbnail from "./PDFThumbnail";

interface Props { busy: boolean; onImport: (questions: File, answers: File) => void; onDemo: () => void; }
type Slot = "questions" | "answers";
const slotLabel: Record<Slot, string> = { questions: "Questions PDF", answers: "Answer Key PDF" };

function formatSize(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`; }

export default function UploadPanel({ busy, onImport, onDemo }: Props) {
  const [questions, setQuestions] = useState<File>();
  const [answers, setAnswers] = useState<File>();
  const [error, setError] = useState("");
  const [unpacking, setUnpacking] = useState(false);
  const [zipStatus, setZipStatus] = useState("");
  const disabled = busy || unpacking;
  const files: Record<Slot, File | undefined> = { questions, answers };

  function put(slot: Slot, file: File | undefined) { slot === "questions" ? setQuestions(file) : setAnswers(file); }
  function selectPdf(file: File | undefined, slot: Slot) {
    if (!file) return;
    try {
      validateFile(file);
      if (!/\.pdf$/i.test(file.name)) throw new Error(`“${file.name}” is not a PDF. Choose a PDF for the ${slotLabel[slot].toLowerCase()}.`);
      put(slot, file); setError("");
    } catch (e) { setError((e as Error).message); }
  }
  async function select(incoming: File[]) {
    if (!incoming.length) return;
    setError(""); setZipStatus("");
    try {
      incoming.forEach(validateFile);
      const zip = incoming.find((file) => /\.zip$/i.test(file.name));
      if (zip) {
        if (incoming.length !== 1) throw new Error("Upload one ZIP at a time, or select the PDFs separately.");
        setUnpacking(true);
        const [q, a] = await extractZip(zip, setZipStatus);
        setQuestions(q); setAnswers(a); setZipStatus("Detected the Questions and Answer Key PDFs."); return;
      }
      for (const file of incoming) {
        if (!/\.pdf$/i.test(file.name)) throw new Error(`“${file.name}” is not supported. Choose PDF files or one ZIP archive.`);
        const namedSlot: Slot | undefined = /answer|key/i.test(file.name) ? "answers" : /question|exam/i.test(file.name) ? "questions" : undefined;
        const target = namedSlot ?? (!questions ? "questions" : !answers ? "answers" : undefined);
        if (!target) throw new Error("Both PDF slots are already filled. Replace a file from its card or remove one first.");
        put(target, file);
      }
    } catch (e) { setError((e as Error).message); setZipStatus(""); }
    finally { setUnpacking(false); }
  }
  function remove(slot: Slot) { put(slot, undefined); setError(""); setZipStatus(""); }

  return <>
    <section className="intro"><span className="eyebrow">IMPORT. ORGANIZE. MASTER.</span><h1>Turn any exam PDF into<br />your next study session.</h1><p>Bring your question paper and answer key.<br className="mobile-break" /> PrepDeck keeps the practice focused.</p></section>
    <section className={`upload-area ${unpacking ? "is-processing" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!disabled) void select(Array.from(e.dataTransfer.files)); }}>
      <div className="upload-symbol"><Archive size={34} /></div>
      <label className={`button primary large ${disabled ? "disabled" : ""}`}>Select PDFs or ZIP<input type="file" accept=".pdf,.zip" multiple disabled={disabled} onChange={(e) => { void select(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }} /></label>
      <p className="muted">or drop your files here</p><span className="small muted">Any exam · PDF or ZIP · Up to 25 MB per file</span>
      <div className="file-grid">{(["questions", "answers"] as Slot[]).map((slot) => { const file = files[slot]; return <article className={`file-card ${file ? "selected" : "missing"}`} key={slot}>
        <div className="file-card-heading"><span className="file-card-icon">{slot === "questions" ? <FileText /> : <FileCheck2 />}</span><div><strong>{slotLabel[slot]}</strong><span className="file-state">{file ? "Selected" : "Missing"}</span></div></div>
        {file ? <><PDFThumbnail file={file} /><div className="file-meta"><strong title={file.name}>{file.name}</strong><span>{formatSize(file.size)}</span></div><div className="file-actions"><label className="text-button">Replace<input type="file" accept=".pdf" disabled={disabled} onChange={(e) => { selectPdf(e.target.files?.[0], slot); e.currentTarget.value = ""; }} /></label><button className="icon-button" type="button" aria-label={`Remove ${slotLabel[slot]}`} disabled={disabled} onClick={() => remove(slot)}><Trash2 size={16} /> Remove</button></div></> : <div className="empty-file"><span>Waiting for a PDF</span><label className="choose-link">Choose file<input type="file" accept=".pdf" disabled={disabled} onChange={(e) => { selectPdf(e.target.files?.[0], slot); e.currentTarget.value = ""; }} /></label></div>}
      </article>; })}</div>
      <p className={`missing-summary ${questions && answers ? "complete" : ""}`} role="status">{questions && answers ? "Both required PDFs selected." : `Still missing: ${!questions ? "Questions PDF" : "Answer Key PDF"}.`}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {zipStatus && <p role="status" className="zip-status">{unpacking ? <span className="spinner" /> : "✓ "}{zipStatus}</p>}
      <button className="primary" disabled={disabled || !questions || !answers} onClick={() => questions && answers && onImport(questions, answers)}>{busy ? "Reading exam…" : "Create practice cards"}</button>
    </section>
    <div className="under-upload"><span><ShieldCheck size={17} /> Your files stay in your browser</span><button className="text-button" disabled={disabled} onClick={onDemo}>{busy ? "Loading…" : "Try a 3-question sample"}</button></div>
    <div className="steps">{[["01", "Bring any exam", "Import a question paper and its answer key."], ["02", "Shape your session", "Choose practice, exam mode, shuffle and timer settings."], ["03", "Learn by doing", "Review mistakes and build confidence one question at a time."]].map(([n, t, d]) => <article key={n}><span className="step-number">{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div>
  </>;
}
