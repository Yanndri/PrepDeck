# PrepDeck answer-key backend

This is a separate AWS Lambda source package for the optional “Generate AI answer-key draft” action. The React app never receives AWS credentials and never calls Bedrock directly.

## AWS setup

1. Install dependencies in this directory and build with `npm run build`.
2. Deploy `src/handler.ts` as a Node.js Lambda behind API Gateway HTTP API.
3. Set `AWS_REGION` to a Bedrock-enabled region, `NOVA_MODEL_ID` to `amazon.nova-2-lite-v1:0` (or an approved Nova 2 Lite inference profile), and `ALLOWED_ORIGIN` to the PrepDeck origin.
4. Grant the Lambda execution role `bedrock:Converse` for the selected Nova model.
5. Configure the frontend with `VITE_ANSWER_KEY_API_URL` pointing at the API Gateway operation. Do not put AWS access keys in `.env` or frontend code.
6. Configure API Gateway CORS for the PrepDeck origin (or use the handler's `ALLOWED_ORIGIN` response header) so browser `POST` and `OPTIONS` requests are accepted.

The handler accepts at most eight questions per request and returns answer objects tied to the original question IDs. The frontend batches larger imports, retries each failed batch once, preserves partial results, and marks invalid or incomplete results unresolved.

Nova 2 Lite structured outputs are not assumed to be schema-enforced. This handler uses the documented Converse tool-schema route and validates every returned ID and answer locally. A null/ambiguous result remains for human review.

Primary references:

- [Amazon Nova 2 Lite model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html)
- [Nova 2 core inference](https://docs.aws.amazon.com/nova/latest/nova2-userguide/core-inference.html)
- [Nova 2 tool use](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-tools.html)
- [Nova 2 request and response schema](https://docs.aws.amazon.com/nova/latest/nova2-userguide/request-response-schema.html)
