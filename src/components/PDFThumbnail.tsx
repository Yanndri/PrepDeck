import { useEffect, useState } from "react";
import { renderFirstPage } from "../lib/pdfPreview";

export default function PDFThumbnail({ file }: { file: File }) {
  const [state, setState] = useState<{ kind: "loading" | "ready" | "error"; value?: string }>({ kind: "loading" });
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void renderFirstPage(file).then((src) => { if (active) setState({ kind: "ready", value: src }); }).catch((error: Error) => { if (active) setState({ kind: "error", value: error.message }); });
    return () => { active = false; };
  }, [file]);
  return <div className={`pdf-thumbnail ${state.kind}`} aria-live="polite">
    {state.kind === "loading" && <><span className="spinner" /><span>Rendering first page…</span></>}
    {state.kind === "error" && <><span className="thumbnail-error">!</span><span>{state.value}</span></>}
    {state.kind === "ready" && <img src={state.value} alt={`First page preview of ${file.name}`} />}
  </div>;
}
