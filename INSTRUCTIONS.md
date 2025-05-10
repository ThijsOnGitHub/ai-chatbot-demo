# AI Chatbot Demo Instructions

This document provides an overview of how the AI chatbot in this project works and how to use it.

## Overview

This is a simple, yet powerful AI chatbot built with:

- Next.js (version 15.2.4)
- Vercel AI SDK
- OpenAI's GPT-4o model
- TailwindCSS for styling
- shadcn/ui for UI components

The chatbot provides a clean, user-friendly interface for conversing with an AI assistant that's designed to provide clear and concise responses.

## How It Works

### Architecture

The chatbot follows a client-server architecture:

1. **Frontend**: React components in `app/page.tsx` that handle the UI and user interactions
2. **Backend**: Next.js API route in `app/api/chat/route.ts` that communicates with the OpenAI API

### Key Components

#### Frontend (`app/page.tsx`)

The frontend uses the `useChat` hook from the Vercel AI SDK, which provides:

- Message history management
- Input handling
- Form submission
- Loading state management

The UI consists of:

- A card container
- A scrollable message area that displays the conversation
- An input field for typing messages
- A send button to submit messages

#### Backend (`app/api/chat/route.ts`)

The backend API route:

- Receives messages from the frontend
- Uses the OpenAI API to generate responses
- Streams the responses back to the frontend for a smooth chat experience

The API is configured to:

- Use the GPT-4o model
- Include a system prompt that instructs the AI to be helpful and concise
- Stream responses for up to 30 seconds

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up your OpenAI API key:
   - Create a `.env.local` file in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

### Running the Application

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. Open your browser and go to [http://localhost:3000](http://localhost:3000)

## Using the Chatbot

1. Type your message in the input field at the bottom of the chat window
2. Press Enter or click the send button (paper airplane icon)
3. Wait for the AI to respond
4. Continue the conversation as needed
5. Click the confetti button (🎉) to celebrate with a confetti animation
6. The AI can also trigger confetti by using a special tool call when appropriate

## Customization

### Changing the AI Model

To use a different OpenAI model, modify the `model` parameter in `app/api/chat/route.ts`:

```typescript
const result = streamText({
  model: openai("gpt-3.5-turbo"), // Change to any supported model
  system: "You are a helpful assistant that provides clear and concise answers.",
  messages,
});
```

### Modifying the System Prompt

To change how the AI behaves, update the `system` parameter in `app/api/chat/route.ts`:

```typescript
const result = streamText({
  model: azure("gpt-4o-mini"),
  system: "You are a friendly customer service representative for Acme Inc.", // Customize this prompt
  messages,
});
```

### Tool Calls

The chatbot implements the AI Tool Calls feature, allowing the AI to trigger actions on the client side:

#### Available Tools

1. **throwConfetti** - Triggers a confetti animation with customizable parameters:

   - `particleCount` - Number of confetti particles (default: 100)
   - `spread` - Spread angle of the confetti (default: 70)
   - `origin.y` - Vertical position of the confetti source (default: 0.6)

2. **throwTextConfetti** - Throws confetti with a text or emoji:
   - `text` - Text or emoji to display in the confetti
   - `scalar` - Scaling factor for the confetti (default: 2)

#### Tool Implementation

Tool calls are centralized in a single place using a DRY (Don't Repeat Yourself) approach:

1. **Single Source of Truth** (`lib/tools.ts`) - Defines all tools using Zod schemas and automatically generates TypeScript types
2. **Backend Integration** (`app/api/chat/route.ts`) - Imports and uses the tool definitions
3. **Frontend Handler** (`app/page.tsx`) - Uses the `handleToolCalls` utility for clean, type-safe implementations

To add a new tool:

1. Define its schema in `lib/tools.ts` using Zod
2. Add a new handler in the `handleToolCalls` object in `page.tsx`

```typescript
// Example of adding a handler for a new tool in page.tsx
onToolCall({ toolCall }) {
  return handleToolCalls(toolCall, {
    // Existing tool handlers...

    // New tool handler - fully type-safe!
    newTool: ({ param1, param2 }) => {
      // Implementation goes here
      return "Tool executed!";
    }
  });
}
```

### Styling the UI

The chatbot uses TailwindCSS and shadcn/ui components for styling. You can customize the appearance by:

- Modifying the TailwindCSS classes in `app/page.tsx`
- Updating theme colors in your TailwindCSS configuration

## Troubleshooting

### API Key Issues

If you see errors related to the OpenAI API:

1. Verify your API key is correct
2. Check that the `.env.local` file is properly set up
3. Make sure you have sufficient credits in your OpenAI account

### Response Timeout

If responses are taking too long or timing out:

- The `maxDuration` in `app/api/chat/route.ts` is set to 30 seconds
- You may need to adjust this value based on your deployment platform's limitations

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [shadcn/ui Documentation](https://ui.shadcn.com)
