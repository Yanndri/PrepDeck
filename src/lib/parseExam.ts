import type { Answer, PageText, Question, TextLine } from "../types";

// PDF text is positional. Sort by row, then column, to read answer tables correctly.
export function parseAnswers(pages: PageText[]): Map<number, Answer> {
  const answers = new Map<number, Answer>();
  for (const page of pages) {
    for (const line of page.lines) {
      for (const match of line.text.matchAll(
        /(?:^|\s)(\d{1,3})\s+([a-d])(?=\s|$)/gi,
      )) {
        const number = Number(match[1]);
        const answer = match[2].toUpperCase() as Answer;
        if (answers.has(number) && answers.get(number) !== answer)
          throw new Error(`Conflicting answers for Q${number}.`);
        answers.set(number, answer);
      }
    }
  }
  if (!answers.size)
    throw new Error(
      "No A–D answer key found. Use a text-based FE Subject A answer PDF.",
    );
  return answers;
}

export function parseQuestions(
  pages: PageText[],
  answers: Map<number, Answer>,
): Question[] {
  const starts: { number: number; page: number; y: number }[] = [];
  for (const page of pages) {
    // The cover contains a sample Q1: never count it as an exam question.
    if (
      /Sample Question|Do not open the exam booklet/i.test(
        page.lines.map((l) => l.text).join(" "),
      )
    )
      continue;
    for (const line of page.lines) {
      const match = line.text.match(/^Q\s*(\d{1,3})\s*[.．]/i);
      if (match)
        starts.push({
          number: Number(match[1]),
          page: page.page,
          y: Math.max(0, line.y - line.height - 5),
        });
    }
  }
  if (!starts.length)
    throw new Error(
      "No question headings found. Scanned PDFs need OCR; this prototype reads text-based FE Subject A PDFs.",
    );
  if (new Set(starts.map((s) => s.number)).size !== starts.length)
    throw new Error(
      "Repeated question numbers found. Upload one Subject A paper at a time.",
    );
  if (
    starts.length !== answers.size ||
    starts.some((s, i) => s.number !== i + 1 || !answers.has(s.number))
  ) {
    throw new Error(
      `Questions and answers do not match (${starts.length} questions, ${answers.size} answers). Check that both files belong to the same Subject A exam.`,
    );
  }
  return starts.map((start, i) => {
    const next = starts[i + 1];
    const finalPage = next?.page ?? pages[pages.length - 1].page;
    const segments = pages
      .filter((p) => p.page >= start.page && p.page <= finalPage)
      .map((p) => ({
        page: p.page,
        top: p.page === start.page ? start.y : 30,
        bottom: next && p.page === next.page ? next.y : p.height - 35,
      }))
      .filter((s) => s.bottom - s.top > 10);
    const text = segments
      .map((s) =>
        pages
          .find((p) => p.page === s.page)!
          .lines.filter((l) => l.y >= s.top && l.y < s.bottom)
          .map((l) => l.text)
          .join(" "),
      )
      .join(" ");
    return {
      number: start.number,
      text,
      segments,
      answer: answers.get(start.number)!,
    };
  });
}

export function groupLines(items: TextLine[]): TextLine[] {
  const rows: TextLine[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r[0].y - item.y) < 3);
    if (row) row.push(item);
    else rows.push([item]);
  }
  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    return {
      ...row[0],
      height: Math.max(...row.map((i) => i.height)),
      text: row
        .map((i) => i.text)
        .join(" ")
        .trim(),
    };
  });
}
