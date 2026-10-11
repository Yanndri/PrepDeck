import { useState } from "react";
import type { Answer, Question } from "../types";
import { prepareExplanation, requestExplanation } from "../lib/explanations";

export default function ExplainMistake({ question, selectedAnswer }: { question: Question; selectedAnswer: Answer }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error" | "limited">("idle");
  const [message, setMessage] = useState("");
  async function explain() {
    if (state === "loading" || state === "ready" || state === "limited") return;
    const prepared = prepareExplanation(question, selectedAnswer);
    if (prepared.limitation) {
      setMessage(prepared.limitation);
      setState("limited");
      return;
    }
    if (!prepared.input) {
      setMessage("This question cannot be explained completely yet.");
      setState("limited");
      return;
    }
    setState("loading");
    setMessage("");
    try {
      setMessage(await requestExplanation(prepared.input));
      setState("ready");
    } catch (error) {
      setMessage((error as Error).message || "Could not load an explanation. Try again.");
      setState("error");
    }
  }
  return <div className="explanation-panel">
    {state === "ready" ? <><p className="explanation-label">Why this answer is correct</p><p className="explanation-text">{renderExplanation(message)}</p></> : state === "limited" ? <p className="explanation-limitation" role="status">{message}</p> : state === "error" ? <p className="explanation-error" role="alert">{message}</p> : null}
    <button type="button" className="explain-button" onClick={explain} disabled={state === "loading" || state === "ready" || state === "limited"}>{state === "loading" ? "Explaining…" : state === "error" ? "Try explanation again" : state === "ready" || state === "limited" ? "Explanation shown" : "Explain my mistake"}</button>
  </div>;
}

function renderExplanation(text: string) {
  return text.split(/(\$[^$]+\$|\\\([^\n]+?\\\))/g).map((part, index) => /^(\$[^$]+\$|\\\([^\n]+?\\\))$/.test(part) ? <code className="math-notation" key={index}>{part}</code> : <span key={index}>{part}</span>);
}
