# Jev typed decisions through OpenRouter

Jev returns typed answers, not chat text. Use the TypeSafe SDK server-side with the OpenRouter integration provisioned by `setupReplitAIIntegrations({ providerSlug: "openrouter" })`. Do not request another API key or change the auto-provisioned env vars. Jev-only features do not need the chat templates or database wiring.

## Required model selection

ALWAYS set the exact `model: "jev-latest"` in every Jev System One SDK call.

## SDK example

Install in your API server workspace (Node.js 20 or newer):

```bash
cd artifacts/api-server
pnpm add @typesafe-ai/sdk
```

```typescript
import { TypeSafeClient } from "@typesafe-ai/sdk";

const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
if (!baseURL || !apiKey) {
  throw new Error("Provision the OpenRouter AI integration before calling Jev.");
}

const jev = new TypeSafeClient({ baseURL, apiKey });
const result = await jev.systemOne({
  model: "jev-latest",
  state: "Checkout shows a blank page when I click Pay.",
  questions: {
    bug: { type: "noul", instructions: "Is this a bug?" },
    team: {
      type: "choice",
      instructions: "Which team should own this ticket?",
      criteria: { payments: "Checkout and payments", account: "Login issues" },
    },
    urgency: {
      type: "score",
      instructions: "How urgent is this ticket?",
      criteria: ["Can wait", "Blocking revenue"],
    },
  },
});

console.log(result.answers.bug.noul);
console.log(result.answers.team.choice);
console.log(result.answers.urgency.score);
```

## TypeSafe API contract

Read the official [API reference](https://docs.typesafe.ai/api) and [JavaScript SDK guide](https://docs.typesafe.ai/sdk/javascript) for full details.

- `systemOne` sends `POST /v1/systemone` with `model`, `state`, and `questions`. State can be a string, object, or array.
- Each named question has `type` and `instructions`. Instructions can be a string, object, or array.
- **Noul:** optional `true`/`false` criteria; `answers.<name>.noul` is the probability of yes in `[0, 1]`.
- **Choice:** required criteria object mapping option keys to descriptions; returns `choice`, `probabilities`, and `confidence`.
- **Score:** required ordered criteria array (2–10 levels); returns the probability-weighted `score`, `legend`, `probabilities`, and `confidence`. With two levels, the score ranges from 0 to 1 and may be fractional.
- Responses contain `model`, `answers` keyed by the question names, and `usage.input_tokens` / `usage.output_tokens`. Answer types are inferred from the SDK request's questions.

## Replit / OpenRouter routing

The TypeSafe docs describe the model schema, not Replit credentials or OpenRouter model routing. For this integration:

- Pass `AI_INTEGRATIONS_OPENROUTER_BASE_URL` directly to the SDK. It already points to the OpenRouter integration; the SDK appends `/v1/systemone`. Do not append `/v1` or `/systemone` yourself.
- Pass `AI_INTEGRATIONS_OPENROUTER_API_KEY` as `apiKey`; the SDK sets Bearer authentication. Do not switch to the direct TypeSafe host or request `TYPESAFE_API_KEY`.
- Send `jev-latest` exactly; OpenRouter maps it to `~typesafe/jev-latest` internally. Do not substitute the mapped ID, a pinned release, or a model returned by the public catalog in SDK requests. The response names the resolved model; it is not a replacement for the next request's `jev-latest`. Latest follows new releases, not fixed model behavior.
- OpenRouter additionally returns `id`, `provider`, and `usage.cost` in USD. Input usage is billed through Replit credits; output tokens are free.
- Jev calls are non-streaming. The SDK's model-listing method is not supported through OpenRouter because its Models API has a different response shape.

See [OpenRouter's TypeSafe SDK guide](https://openrouter.ai/docs/guides/community/typesafe-sdk) for these provider-specific details.