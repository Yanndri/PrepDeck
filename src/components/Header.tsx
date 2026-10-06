import { BookOpen } from "lucide-react";
export default function Header() {
  return (
    <header className="header">
      <a className="brand" href="./">
        <BookOpen aria-hidden="true" />
        <span>
          FE<span className="red">Practice</span>
        </span>
      </a>
      <span className="header-label">PHILNITS REVIEWER</span>
      <a
        href="https://www.itpec.org/pastexamqa/fe.html"
        target="_blank"
        rel="noreferrer"
      >
        Get exam PDFs ↗
      </a>
    </header>
  );
}
