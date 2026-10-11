import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const modelId = process.env.NOVA_MODEL_ID || "amazon.nova-2-lite-v1:0";
const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "ap-southeast-2" });
const answerPattern = /^[A-D]$/;
const answerKeySchema = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "integer" },
          answer: { type: ["string", "null"] },
          explanation: { type: "string" },
          ambiguous: { type: "boolean" },
        },
        required: ["questionId", "answer", "explanation", "ambiguous"],
      },
    },
  },
  required: ["answers"],
};

interface InputQuestion { id: number; question: string; choices: string[]; }
interface Event { body?: string | null; headers?: Record<string, string | undefined>; requestContext?: { http?: { method?: string } }; }
interface Candidate { questionId?: unknown; answer?: unknown; explanation?: unknown; ambiguous?: unknown; }

export async function handler(event: Event) {
  if (event.requestContext?.http?.method === "OPTIONS") return response(204, {});
  try {
    const input = parseInput(event.body);
    const modelResponse = await generate(input.questions);
    return response(200, { answers: validateModelResponse(modelResponse, input.questions) });
  } catch (error) {
    console.error(error);
    return response(400, { error: error instanceof Error ? error.message : "Could not generate an answer-key draft." });
  }
}

function parseInput(body: string | null | undefined): { questions: InputQuestion[] } {
  if (!body) throw new Error("Request body is required.");
  const value: unknown = JSON.parse(body);
  if (!value || typeof value !== "object" || !Array.isArray((value as { questions?: unknown }).questions)) throw new Error("Expected a questions array.");
  const questions = (value as { questions: unknown[] }).questions;
  if (questions.length === 0 || questions.length > 8) throw new Error("Send between 1 and 8 questions per batch.");
  return { questions: questions.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Each question must be an object.");
    const item = raw as Partial<InputQuestion>;
    if (!Number.isInteger(item.id) || typeof item.question !== "string" || !Array.isArray(item.choices) || item.choices.length !== 4 || item.choices.some((choice) => typeof choice !== "string")) throw new Error("Each question needs an integer id, text, and four choices.");
    return { id: item.id, question: item.question, choices: item.choices };
  }) };
}

async function generate(questions: InputQuestion[]): Promise<unknown> {
  const prompt = [
    "You are drafting an answer key for multiple-choice exam questions.",
    "Return one answer object for every question ID. Answer only when the supplied text and choices are sufficient.",
    "If a diagram, missing context, ambiguity, or uncertainty prevents a reliable answer, use answer null and ambiguous true. Never invent an answer.",
    "Keep explanations short and evidence-based from the supplied text. Do not claim verification.",
    JSON.stringify({ questions }),
  ].join("\n\n");
  const result = await client.send(new ConverseCommand({
    modelId,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { temperature: 0, maxTokens: 2400 },
    toolConfig: {
      tools: [{ toolSpec: { name: "answer_key", description: "Return proposed answers tied to original question IDs.", inputSchema: { json: answerKeySchema } } }],
      toolChoice: { tool: { name: "answer_key" } },
    },
  }));
  const toolUse = result.output?.message?.content?.find((block) => block.toolUse)?.toolUse;
  if (!toolUse?.input) throw new Error("The model did not return a structured answer-key draft.");
  return toolUse.input;
}

function validateModelResponse(value: unknown, questions: InputQuestion[]) {
  if (!value || typeof value !== "object" || !Array.isArray((value as { answers?: unknown }).answers)) throw new Error("The model response did not contain an answers array.");
  const byId = new Map(questions.map((question) => [question.id, question]));
  return (value as { answers: Candidate[] }).answers.map((candidate) => {
    const question = byId.get(Number(candidate.questionId));
    const answer = typeof candidate.answer === "string" ? candidate.answer.toUpperCase() : null;
    const valid = !!question && (answer === null || (answerPattern.test(answer) && question.choices.some((choice) => choice.startsWith(`${answer})`) || choice.startsWith(`${answer}.`))));
    return { questionId: Number(candidate.questionId), answer: valid ? answer : null, explanation: typeof candidate.explanation === "string" ? candidate.explanation.slice(0, 500) : "", ambiguous: valid ? candidate.ambiguous === true : true };
  });
}

function response(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Headers": "content-type" }, body: JSON.stringify(body) };
}
