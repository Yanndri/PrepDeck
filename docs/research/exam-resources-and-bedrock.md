# Exam resources and Amazon Bedrock findings

Verified 2026-10-11 against first-party sources.

## ITPEC FE past exams

The official ITPEC page is [FE Past Examination Questions and Answers](https://www.itpec.org/pastexamqa/fe.html). It is an index of downloadable question-and-answer PDFs for the Fundamental Information Technology Engineers Examination, with entries from April 2026 back to April 2007. The page currently includes April 2026, October 2025, April 2025, and earlier exam sessions.

ITPEC's stated reuse terms are material for PrepDeck: educational use of the published questions does not require permission or usage fees, but copyright is not waived; the source must be shown in the form `(YearSeason, Exam Category, (Subject), Question number)`, and modified question parts must be identified. ITPEC also states that it provides no additional data beyond the published PDFs. These terms are on the [official FE resource page](https://www.itpec.org/pastexamqa/fe.html).

## Amazon Nova 2 Lite access

- The [Nova 2 Lite model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html) lists `bedrock-runtime` as the endpoint and marks both `Invoke` and `Converse` as supported. Its sample code uses `amazon.nova-2-lite-v1:0` with `boto3.client("bedrock-runtime")` for both `invoke_model` and `converse`.
- The [Nova 2 core-inference guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/core-inference.html) lists these model IDs: `amazon.nova-2-lite-v1:0` (in-region), `us.amazon.nova-2-lite-v1:0`, and `global.amazon.nova-2-lite-v1:0`. It describes Converse as the portable interface recommended for most use cases and Invoke as the model-native interface.
- The [Nova 2 request/response schema](https://docs.aws.amazon.com/nova/latest/nova2-userguide/request-response-schema.html) says the request shape is nearly identical between the APIs; binary data differs because Converse uses binary arrays while Invoke uses Base64 strings. A normal response is read from `output.message.content`, whose blocks may contain `text` or `toolUse`.
- The [Nova 2 Invoke guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-invoke-api.html) shows `invoke_model` with a JSON body containing `messages` and `inferenceConfig`; it states that Invoke supports the same features as Converse except document input, which is Converse-specific.
- The [Nova 2 tool-use guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-tools.html) documents JSON Schema tool inputs, constrained decoding, and `toolChoice` with a named tool. AWS says the named `Tool` choice calls the specified tool once and is ideal for structured-output use cases. The page includes a working Converse example with `us.amazon.nova-2-lite-v1:0`.

## Structured JSON limitation

Do not describe Nova 2 Lite as supporting Bedrock's schema-enforced structured-output feature. The current [Nova 2 Lite model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html) explicitly marks **Structured outputs** as not supported, even though the general [Bedrock structured-outputs guide](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html) says the feature is available through Converse and InvokeModel for supported models.

For Nova 2 Lite, AWS documents best-effort JSON formatting instead: provide an output schema and request JSON-only output, optionally prefill the assistant response with `{` or a `json` fence, and use `temperature=0`; AWS cautions that this output can still vary from the schema. See [Nova 2 advanced prompting techniques](https://docs.aws.amazon.com/nova/latest/nova2-userguide/advanced-prompting-techniques.html). For stronger shape enforcement, use the documented tool-schema route and validate the returned `toolUse.input` in application code; this is tool calling, not the unavailable Bedrock `outputConfig.textFormat` capability for Nova 2 Lite.

### Practical conclusion for PrepDeck

Use ITPEC's linked PDFs as the authoritative exam-resource index, preserve the required source label when displaying imported questions, and treat any Nova 2 Lite JSON response as untrusted until parsed and validated locally. If strict JSON Schema-conformant output is a hard requirement, select a Bedrock model whose model card supports structured outputs rather than assuming Nova 2 Lite does.
