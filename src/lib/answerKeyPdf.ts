import type { Exam } from "../types";
import type { AnswerKeyDraft } from "./answerKey";

export function answerKeyText(exam: Exam, drafts: Record<number, AnswerKeyDraft> = {}, tag = ""): string[] {
  const lines = [
    `PrepDeck Answer Key — ${exam.title}`,
    ...(tag.trim() ? [`Tag: ${tag.trim()}`] : []),
    "Review status: answers marked AI-generated require human review.",
    "",
    ...exam.questions.map((question) => `Q${question.number} ${question.answer ?? "UNRESOLVED"}${drafts[question.number]?.source === "ai" && question.answer ? " [AI-generated — review before use]" : ""}`),
  ];
  return lines;
}

export function downloadAnswerKeyPdf(exam: Exam, drafts?: Record<number, AnswerKeyDraft>, tag = "") {
  const cleanTag = tag.trim();
  const bytes = buildAnswerKeyPdf(answerKeyText(exam, drafts, cleanTag));
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(exam.title)}${cleanTag ? `-${safeFilename(cleanTag)}` : ""}-answer-key.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildAnswerKeyPdf(lines: string[]): Uint8Array {
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 42) pages.push(lines.slice(index, index + 42));
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [PAGE_REFS] /Count PAGE_COUNT >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageRefs: number[] = [];
  for (const pageLines of pages.length ? pages : [[]]) {
    const content = ["BT", "/F1 10 Tf", "50 760 Td", ...pageLines.map((line, index) => `${index ? "0 -16 Td " : ""}(${escapePdfText(line)}) Tj`), "ET"].join("\n");
    const contentObject = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageObject = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`);
    pageRefs.push(pageObject);
  }
  objects[1] = objects[1].replace("PAGE_REFS", pageRefs.map((ref) => `${ref} 0 R`).join(" ")).replace("PAGE_COUNT", String(pageRefs.length));
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function escapePdfText(value: string) { return value.replace(/\\/g, "\\\\").replace(/[()]/g, (character) => `\\${character}`).replace(/[^\x20-\x7E]/g, "?"); }
function safeFilename(value: string) { return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "prepdeck"; }
