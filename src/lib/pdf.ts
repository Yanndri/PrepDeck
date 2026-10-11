import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Exam, PageText } from "../types";
import { groupLines, parseAnswers, parseQuestions } from "./parseExam";
GlobalWorkerOptions.workerSrc = workerUrl;

async function readPages(pdf: PDFDocumentProxy): Promise<PageText[]> {
  if (pdf.numPages > 150)
    throw new Error("Please choose an exam with 150 pages or fewer.");
  const pages: PageText[] = [];
  for (let page = 1; page <= pdf.numPages; page++) {
    const documentPage = await pdf.getPage(page);
    const viewport = documentPage.getViewport({ scale: 1 });
    const content = await documentPage.getTextContent();
    const items = content.items.flatMap((item) => {
      if (!("str" in item) || !item.str.trim()) return [];
      return [
        {
          text: item.str,
          x: item.transform[4],
          y: viewport.height - item.transform[5],
          height: item.height || 12,
        },
      ];
    });
    pages.push({ page, height: viewport.height, lines: groupLines(items) });
  }
  return pages;
}

export async function importExam(
  questions: File,
  answers: File,
): Promise<Exam> {
  let questionPdf: PDFDocumentProxy | undefined;
  let answerPdf: PDFDocumentProxy | undefined;
  try {
    questionPdf = await getDocument({
      data: new Uint8Array(await questions.arrayBuffer()),
    }).promise;
    answerPdf = await getDocument({
      data: new Uint8Array(await answers.arrayBuffer()),
    }).promise;
    const questionPages = await readPages(questionPdf);
    const answerPages = await readPages(answerPdf);
    const source = questions.name
      .replace(/_(?:Questions|Question|Exam|Paper).*$/i, "")
      .replace(/\.pdf$/i, "");
    return {
      title: source.replace(/_/g, " "),
      source,
      pdf: questionPdf,
      questions: parseQuestions(questionPages, parseAnswers(answerPages)),
    };
  } catch (error) {
    await questionPdf?.loadingTask.destroy();
    throw error;
  } finally {
    await answerPdf?.loadingTask.destroy();
  }
}
