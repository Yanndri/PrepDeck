import { Layers3 } from "lucide-react";
export default function Header({ onFindResources }: { onFindResources: () => void }) {
  return (
    <header className="header">
      <a className="brand" href="./">
        <span className="brand-mark"><Layers3 aria-hidden="true" /></span>
        <span>Prep<span className="red">Deck</span></span>
      </a>
      {/* <span className="header-label">EXAM STUDY WORKSPACE</span> */}
      <button className="header-resources" onClick={onFindResources}>Find Exam PDFs</button>
      <div className="header-auth-actions" aria-label="Account actions">
        <button type="button" className="header-auth">Log in</button>
        <button type="button" className="header-auth header-auth-signup">Sign up</button>
      </div>
    </header>
  );
}
