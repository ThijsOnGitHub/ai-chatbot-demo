// Types for AI Tool Calls

// Type for the confetti tool call parameters
export interface ConfettiToolParams {

}


export type TextConfettiTool = {
  text: string;
  scalar: number;
}
// For compatibility with the AI SDK's tool call structure
export type AIToolCall<Name extends string = string, Args = unknown> = {
  toolName: Name;
  args: Args;
};

// Type guard to check if a tool call is for throwConfetti
export function isThrowConfettiToolCall(toolCall: AIToolCall<string, unknown>): toolCall is AIToolCall<"throwConfetti", ConfettiToolParams> {
  return toolCall.toolName === "throwConfetti";
}

export function isThrowTextConfettiToolCall(toolCall: AIToolCall<string, unknown>): toolCall is AIToolCall<"throwTextConfetti", TextConfettiTool> {
  return toolCall.toolName === "throwTextConfetti";
}