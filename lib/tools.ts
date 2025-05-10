import { z } from "zod";

// Define all tool schemas in one place
export const toolSchemas = {
  throwConfetti: {
    description: "Throw confetti to celebrate with the user",
    parameters: z.object({
    }),
  },
  throwTextConfetti: {
    description: "Throw confetti with a text or emoji",
    parameters: z.object({
      text: z.string().describe("Text or emoji to display in the confetti"),
      scalar: z.number().optional().default(2).describe("Scaling factor for the confetti"),
    }),
  },
};

// Export type for the tool names
export type ToolName = keyof typeof toolSchemas;

// Generate types for each tool's parameters based on the Zod schema
export type ToolParameters = {
  [K in ToolName]: {
    toolName: K;
    args: z.infer<(typeof toolSchemas)[K]["parameters"]>;
  };
}[keyof typeof toolSchemas];
