import { useEffect, useState } from "react";
import type { Exam, Question } from "../types";
export default function QuestionView({
  exam,
  question,
}: {
  exam: Exam;
  question: Question;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let cancelled = false;
    setImages([]);
    setError("");
    async function render() {
      const result: string[] = [];
      for (const segment of question.segments) {
        const page = await exam.pdf.getPage(segment.page);
        if (cancelled) return;
        const scale = 1.6;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil((segment.bottom - segment.top) * scale);
        const context = canvas.getContext("2d")!;
        await page.render({
          canvasContext: context,
          canvas,
          viewport,
          transform: [1, 0, 0, 1, 0, -segment.top * scale],
        }).promise;
        result.push(canvas.toDataURL("image/png"));
        canvas.width = canvas.height = 0;
      }
      if (!cancelled) setImages(result);
    }
    void render().catch((e) => {
      if (!cancelled) setError(String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [exam, question]);
  return (
    <div className="question-paper">
      <div className="pdf-controls" aria-label="PDF zoom controls">
        <span>Question crop</span>
        <button type="button" onClick={() => setZoom(Math.max(1, zoom - 0.25))} disabled={zoom <= 1} aria-label="Zoom out">−</button>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(Math.min(3, zoom + 0.25))} disabled={zoom >= 3} aria-label="Zoom in">+</button>
        {zoom > 1 && <span className="small muted">Scroll to pan</span>}
      </div>
      {error ? (
        <p role="alert">Could not render the question: {error}</p>
      ) : images.length ? (
        <div className={`question-zoom ${zoom > 1 ? "zoomed" : ""}`}>
          <div className="question-images" style={{ width: `${zoom * 100}%` }}>
            {images.map((image, i) => <img key={i} src={image} alt={`Question ${question.number}, part ${i + 1}. Full extracted text is below.`} />)}
          </div>
        </div>
      ) : (
        <p role="status">Loading question…</p>
      )}
      <details>
        <summary>Extracted text</summary>
        <p>{question.text}</p>
      </details>
    </div>
  );
}
