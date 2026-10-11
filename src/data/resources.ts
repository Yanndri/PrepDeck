export interface ExamResource {
  id: string;
  title: string;
  publisher: string;
  subject: string;
  examType: string;
  year: string;
  sourceUrl: string;
  answerKeyAvailable: boolean | "varies";
  answerKeyNote: string;
}

// Keep this list curated and link to the original publisher. Add a resource only after verifying its page.
export const examResources: ExamResource[] = [
  {
    id: "itpec-past-exams",
    title: "Past Examination Questions and Answers",
    publisher: "Information Technology Professionals Examination Council (ITPEC)",
    subject: "Information technology",
    examType: "Professional certification",
    year: "2007–2026",
    sourceUrl: "https://www.itpec.org/pastexamqa/fe.html",
    answerKeyAvailable: true,
    answerKeyNote: "The publisher page lists question-and-answer PDFs by exam date.",
  },
];
