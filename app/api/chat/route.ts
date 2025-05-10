import { toolSchemas } from "@/lib/tools";
import { azureFoundry } from "@/provider/AzureFoundryProvider";
import { OpenAIResponsesProviderOptions } from "@ai-sdk/openai/internal";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: azureFoundry({
      agentId: "asst_J239iSJG5Gqwa83NE58DL8j2",
    }),
    maxSteps: 10,
    messages,
    providerOptions: {
      openai: {
        store: true,
      } satisfies OpenAIResponsesProviderOptions,
    },
    tools: toolSchemas,
  });

  return result.toDataStreamResponse({
    getErrorMessage(error) {
      if (error == null) {
        return "unknown error";
      }

      if (typeof error === "string") {
        return error;
      }

      if (error instanceof Error) {
        return error.message;
      }

      return JSON.stringify(error);
    },
  });
}
