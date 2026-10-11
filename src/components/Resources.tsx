import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import { examResources } from "../data/resources";

export default function Resources({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [examType, setExamType] = useState("all");
  const [year, setYear] = useState("all");
  const subjects = [...new Set(examResources.map((resource) => resource.subject))];
  const types = [...new Set(examResources.map((resource) => resource.examType))];
  const years = [...new Set(examResources.map((resource) => resource.year))];
  const filtered = useMemo(() => examResources.filter((resource) => {
    const haystack = `${resource.title} ${resource.publisher} ${resource.subject} ${resource.examType} ${resource.year}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (subject === "all" || resource.subject === subject) && (examType === "all" || resource.examType === examType) && (year === "all" || resource.year === year);
  }), [query, subject, examType, year]);
  return <section className="workspace resources-page">
    <div className="section-title"><div><span className="eyebrow">EXAM RESOURCE DESK</span><h1>Find exam PDFs.</h1><p>Curated links to original publishers. PrepDeck does not copy or host their PDFs.</p></div><button onClick={onBack}><ArrowLeft size={16} /> Back</button></div>
    <div className="resource-filters"><label className="resource-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exams, subjects or publishers" aria-label="Search exam resources" /></label><label><span>Subject</span><select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="all">All subjects</option>{subjects.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Exam type</span><select value={examType} onChange={(e) => setExamType(e.target.value)}><option value="all">All exam types</option>{types.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Year</span><select value={year} onChange={(e) => setYear(e.target.value)}><option value="all">All years</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <div className="resource-list">{filtered.length ? filtered.map((resource) => <article className="resource-card" key={resource.id}><div className="resource-card-top"><div><span className="resource-type">{resource.examType}</span><h2>{resource.title}</h2></div><span className="resource-year">{resource.year}</span></div><p>{resource.publisher}</p><div className="resource-meta"><span>{resource.subject}</span><span className={resource.answerKeyAvailable === true ? "available" : "varies"}>{resource.answerKeyAvailable === true ? "Answer key available" : "Answer key varies"}</span></div><p className="resource-note">{resource.answerKeyNote}</p><a className="button primary resource-link" href={resource.sourceUrl} target="_blank" rel="noreferrer">Open publisher page <ExternalLink size={15} /></a></article>) : <div className="empty-resource"><Search size={25} /><h2>No matching resources</h2><p>Try a different search or clear one of the filters.</p><button onClick={() => { setQuery(""); setSubject("all"); setExamType("all"); setYear("all"); }}>Clear filters</button></div>}</div>
  </section>;
}
