"use client";
import { useChat } from "@ai-sdk/react";
import { PartyPopper, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import confetti from "canvas-confetti";
import { ToolParameters } from "@/lib/tools";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useAutoscroll } from "@/hooks/use-autoscroll";
import { AttachmentPreviewItem } from "@/components/chat/attachment-preview-item";
import { MessageAttachment } from "@/components/chat/message-attachment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const { attachments, fileInputRef, handleFileClick, handleFileChange, handleRemoveFile, resetAttachments, getAttachmentFileList } = useFileUpload();

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    handleSubmit: originalHandleSubmit,
  } = useChat({
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

  // Custom handleSubmit to include file attachments
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    originalHandleSubmit(event, {
      experimental_attachments: getAttachmentFileList(),
    });
    // Reset attachments after sending
    resetAttachments();
  };

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

  // Set up autoscroll for messages
  const scrollRef = useAutoscroll({
    deps: [messages],
    enabled: true,
    smooth: true,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-center flex-grow">AI Chatbot</h1>
          <Button variant="outline" size="icon" onClick={handleConfettiClick} title="Gooi confetti!" className="ml-2">
            <PartyPopper className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Start a conversation with the AI assistant.</p>
              </div>
            )}

            {messages.map((message: any) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <article className={`max-w-[80%] rounded-lg p-3 whitespace-break-spaces prose ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="prose ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>

                  {message.experimental_attachments && message.experimental_attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.experimental_attachments.map((file: any, index: number) => (
                        <MessageAttachment key={index} file={file} />
                      ))}
                    </div>
                  )}
                </article>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((attachment, index) => (
                  <AttachmentPreviewItem key={index} attachment={attachment} index={index} onRemove={handleRemoveFile} />
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-1" disabled={isLoading} />
              <Button type="button" size="icon" variant="outline" onClick={handleFileClick} disabled={isLoading}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || (input.trim() === "" && attachments.length === 0)}>
                <Send className="h-4 w-4" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
