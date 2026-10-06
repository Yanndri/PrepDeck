import JSZip from "jszip";
const MAX_BYTES = 25 * 1024 * 1024;
export function validateFile(file: File) {
  if (file.size > MAX_BYTES)
    throw new Error(`“${file.name}” is too large. Each file must be 25 MB or smaller.`);
  if (!/\.(pdf|zip)$/i.test(file.name))
    throw new Error(`“${file.name}” is not supported. Choose a PDF or an ITPEC ZIP archive.`);
}
export async function extractZip(file: File, onProgress?: (message: string) => void): Promise<[File, File]> {
  validateFile(file);
  onProgress?.("Scanning ZIP contents…");
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter(
    (f) => !f.dir && /\.pdf$/i.test(f.name) && !f.name.includes("__MACOSX"),
  );
  const qs = entries.filter((f) => /FE[-_]A.*Questions/i.test(f.name));
  const keys = entries.filter((f) => /FE[-_]A.*Answers/i.test(f.name));
  if (qs.length !== 1 || keys.length !== 1)
    throw new Error(
      "This ZIP must contain one FE-A Questions PDF and one FE-A Answers PDF. You can also extract and select the PDFs manually.",
    );
  // Stream selected entries with an output cap rather than expanding the whole archive.
  async function unpack(entry: (typeof entries)[number]): Promise<File> {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    onProgress?.(`Extracting ${entry.name.split("/").pop()}…`);
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const stream = (
        entry as unknown as {
          internalStream(type: string): {
            on(event: string, callback: (...args: any[]) => void): any;
            pause(): void;
            resume(): void;
          };
        }
      ).internalStream("uint8array");
      stream
        .on("data", (chunk: Uint8Array<ArrayBuffer>) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            stream.pause();
            settled = true;
            reject(new Error(`The extracted PDF “${entry.name.split("/").pop()}” exceeds the 25 MB limit.`));
            return;
          }
          chunks.push(chunk);
          onProgress?.(`Extracting ${entry.name.split("/").pop()}…`);
        })
        .on("error", (error: Error) => {
          if (!settled) {
            settled = true;
            reject(new Error(`Could not extract “${entry.name.split("/").pop()}”. The ZIP may be damaged.`, { cause: error }));
          }
        })
        .on("end", () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        })
        .resume();
    });
    return new File(chunks, entry.name.split("/").pop()!, {
      type: "application/pdf",
    });
  }
  return [await unpack(qs[0]), await unpack(keys[0])];
}
