import { Layers3, ShieldCheck } from "lucide-react";
export default function Header() {
  return (
    <header className="header">
      <a className="brand" href="./">
        <span className="brand-mark"><Layers3 aria-hidden="true" /></span>
        <span>Prep<span className="red">Deck</span></span>
      </a>
      <span className="header-label">EXAM STUDY WORKSPACE</span>
      <span className="header-private"><ShieldCheck size={15} /> Private by default</span>
    </header>
  );
}
