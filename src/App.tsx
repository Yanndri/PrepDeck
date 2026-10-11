import { useState } from "react";
import Header from "./components/Header";
import UploadPanel from "./components/UploadPanel";
import ImportPreview from "./components/ImportPreview";
import Practice from "./components/Practice";
import Setup from "./components/Setup";
import { importExam } from "./lib/pdf";
import type { Exam, SessionSetup } from "./types";
export default function App() {
  const [exam, setExam] = useState<Exam>();
  const [screen, setScreen] = useState<"upload" | "preview" | "setup" | "practice">(
    "upload",
  );
  const [sessionSetup, setSessionSetup] = useState<SessionSetup>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load(questions: File, answers: File) {
    setBusy(true);
    setError("");
    try {
      const next = await importExam(questions, answers);
      setExam(next);
      setScreen("preview");
    } catch (e) {
      setError(
        (e as Error).message ||
          "Could not read those files. Try text-based, unencrypted exam PDFs.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const files = await Promise.all(
        ["Questions", "Answers"].map(async (name) => {
          const response = await fetch(
            `${import.meta.env.BASE_URL}samples/Demo_${name}.pdf`,
          );
          if (!response.ok) throw new Error("Could not load the sample.");
          return new File([await response.blob()], `Demo_${name}.pdf`, {
            type: "application/pdf",
          });
        }),
      );
      await load(files[0], files[1]);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  function reset() {
    void exam?.pdf.loadingTask.destroy();
    setExam(undefined);
    setSessionSetup(undefined);
    setScreen("upload");
    setError("");
  }
  return (
    <>
      <Header />
      <main>
        {error && (
          <div className="error global-error" role="alert">
            {error}
          </div>
        )}
        {screen === "upload" ? (
          <UploadPanel busy={busy} onImport={load} onDemo={demo} />
        ) : exam && screen === "preview" ? (
          <ImportPreview
            exam={exam}
            onStart={() => setScreen("setup")}
            onBack={reset}
          />
        ) : exam && screen === "setup" ? (
          <Setup exam={exam} onStart={(setup: SessionSetup) => { setSessionSetup(setup); setScreen("practice"); }} onBack={() => setScreen("preview")} />
        ) : exam ? (
          <Practice exam={exam} setup={sessionSetup!} onExit={reset} onSetup={() => setScreen("setup")} />
        ) : null}
      </main>
      <footer>
        <span>PrepDeck · An independent study tool</span>
        <span>Any exam · Files are cleared when you refresh</span>
      </footer>
    </>
  );
}
