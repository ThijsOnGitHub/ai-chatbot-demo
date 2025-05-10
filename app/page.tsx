"use client";
import { useChat } from "@ai-sdk/react";
import { PartyPopper, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import confetti from "canvas-confetti";
import { ToolParameters } from "@/lib/tools";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 10,
    
    onToolCall({ toolCall }) {
      console.log("Tool call:", toolCall);
      const toolCallTyped = toolCall as unknown as ToolParameters;
      if (toolCallTyped.toolName === "throwConfetti") {
  
        throwConfettiWithParams();
        return "Throwing confetti...";
      }
      if (toolCallTyped.toolName === "throwTextConfetti") {
        const { text, scalar } = toolCallTyped.args;
        throwConfettiWithParams(100 * scalar, 70, 0.6);
        return `Throwing text confetti with "${text}"...`;
      }
    },
  });


  // Function to trigger confetti with specified parameters
  const throwConfettiWithParams = (particleCount: number = 100, spread: number = 70, y: number = 0.6) => {
    confetti({
      particleCount,
      spread,
      origin: { y },
    });
  };

  // Function for button click (with no parameters)
  const handleConfettiClick = () => {
    throwConfettiWithParams();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-center flex-grow">AI Chatbot</h1>
          <Button variant="outline" size="icon" onClick={handleConfettiClick} title="Gooi confetti!" className="ml-2">
            <PartyPopper className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Start a conversation with the AI assistant.</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{message.content}</div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-1" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
