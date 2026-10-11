# PrepDeck

A browser-only exam study workspace built with React, TypeScript, Vite, PDF.js and JSZip. Import a text-based question paper and answer key from any exam, then create focused practice or exam sessions.

## Run locally

Install Node.js 22.12+ (Node 24 recommended), then open a terminal in this folder:

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Try the included sample, or select your own matching exam PDFs. ZIP imports can contain a named question/paper PDF and answer key PDF; if an archive contains multiple exams, select the matching pair manually.

```sh
npm run build     # Type-check and create dist/
npm run preview   # Preview the production build
npm test          # Parser regression tests
```

## File map

| File                               | Responsibility                                                    |
| ---------------------------------- | ----------------------------------------------------------------- |
| `src/App.tsx`                      | Import, preview and practice screen transitions; PDF lifetime     |
| `src/types.ts`                     | Shared exam, question, answer and PDF-region types                |
| `src/components/Header.tsx`        | PrepDeck branding and browser-only privacy cue                     |
| `src/components/UploadPanel.tsx`   | Drop zone, PDF selectors, ZIP selection and sample action         |
| `src/components/ImportPreview.tsx` | Inspect detected cards before starting                            |
| `src/components/QuestionView.tsx`  | Render original PDF regions, preserving diagrams and tables       |
| `src/components/Setup.tsx`         | Practice/exam mode, session size, shuffle and timer setup         |
| `src/components/Practice.tsx`      | Session navigation, answers, flags, feedback and timer            |
| `src/components/Results.tsx`       | Accuracy, filters, PDF review and retry actions                   |
| `src/lib/files.ts`                 | File validation and capped ZIP extraction                         |
| `src/lib/pdf.ts`                   | Load PDF.js, extract positional text and assemble an exam         |
| `src/lib/parseExam.ts`             | Pure question-boundary and answer-table parsing                   |
| `src/lib/session.ts`                | Stable session ordering, scoring, navigation state and timer math |
| `src/styles/global.css`            | Theme, upload layout, practice styles and mobile rules            |
| `public/samples/`                  | Two sample PDFs for local testing                                  |
| `tests/parser.test.ts`             | Column pairing, cover exclusion, continuations and mismatch tests |
| `tests/session.test.ts`            | Session ordering, scoring, navigation state and timer tests        |

## Publish on Cloudflare Pages

### Upload the included build

The `dist/` folder is already built. In Cloudflare Pages, create a Direct Upload project and upload the **contents of dist/** (or drag the dist folder when the dashboard accepts folders). Do not upload the project source as the website. Cloudflare provides a public pages.dev URL after deployment.

### Connect GitHub for future updates

Create a repository containing this project (exclude node_modules), then create a Cloudflare Pages project connected to it:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root, or `philnits-reviewer` if nested
- Node version: 24

Choose Git integration initially if you want automatic deployments; Direct Upload projects cannot simply be switched to Git integration later. No AWS credentials, accounts or backend are required. Copy `.env.example` to `.env.local` to override the browser explanation endpoint with `VITE_EXPLANATION_API_URL`.

## How PDF extraction works

1. Read positioned text with PDF.js and group text items into rows.
2. Skip the cover's sample question and detect `Q1.`, `Q2.`, etc.
3. Match each number to an A–D answer in the answer PDF.
4. Reject duplicate, missing, conflicting or non-contiguous question mappings.
5. Crop rendered page regions between question headings, including continuations across pages.
6. Render only the current card, rather than pre-rendering the entire exam.

Source references appear above each question. The original PDF wording and diagrams are preserved; the crop changes presentation. Extracted text is available below the image but may not fully describe diagrams.

## Scope and limitations

- Tested: production build and parser/session regression tests. The parser is designed for text-based exam papers with numbered questions and A–D answer keys.
- OCR/scanned files, encrypted PDFs and arbitrary textbook layouts are outside this example's scope.
- 25 MB per selected file or extracted PDF; at most 150 pages per PDF. These are app limits, not Cloudflare limits on locally selected files.
- Parsing is heuristic. Always inspect the preview. Matching counts alone cannot prove two custom-named files belong to the same exam.
- Explanations are optional browser requests containing only the extracted question and choices; no PDF bytes or AWS credentials are sent. Results show practice accuracy only.
- Session state stays in memory; refreshing clears files and progress. No accounts or cloud sync.
- No PDF bytes are uploaded. The demo loads local hosted sample assets; Google Fonts is used for typography and can be removed from the CSS for self-contained font loading.
- Browser/device memory still limits practical document size. No end-to-end browser or phone performance testing was performed in this environment.

PrepDeck is an independent browser-only study tool. Uploaded filenames are shown as source labels; retain any attribution required by the exam provider if you share generated study material.
