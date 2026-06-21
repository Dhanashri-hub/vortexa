import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

let openaiClient: any;

if (!apiKey) {
  // Provide a stub client so the server can start in dev without a key.
  // Calls to the stub will throw with a clear message.
  // eslint-disable-next-line no-console
  console.warn("OPENAI_API_KEY not set — OpenAI client will throw if used.");

  const stub = {
    chat: {
      completions: {
        create: async () => {
          throw new Error("OPENAI_API_KEY is not configured on this server.");
        },
      },
    },
  };

  openaiClient = stub;
} else {
  openaiClient = new OpenAI({ apiKey });
}

export const openai = openaiClient;
