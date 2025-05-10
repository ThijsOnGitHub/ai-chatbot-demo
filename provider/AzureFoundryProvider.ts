import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential, type TokenCredential } from "@azure/identity";
import { generateId, loadApiKey, withoutTrailingSlash } from "@ai-sdk/provider-utils";
import { LanguageModelV1, LanguageModelV1CallWarning, LanguageModelV1StreamPart, LanguageModelV1CallOptions } from "@ai-sdk/provider";

/**
 * De combinatie van agentId & threadId die we straks als 'modelId' doorgeven
 */
export type CustomChatModelId = {
  agentId: string;
  threadId?: string;
};

/**
 * Eventueel extra instellingen per request
 */
export interface CustomChatSettings {
  /** Poll-interval in milliseconden (default 1000ms) */
  pollIntervalMs?: number;
}

/**
 * Interface voor opties van Azure AI Foundry client
 */
export interface AzureFoundryClientOptions {
  /** Unieke naam van de provider */
  provider: string;
  /** Azure AI Projects connection string */
  baseURL: string;
  /** Optionele Azure credential */
  credential?: TokenCredential;
  /** Optionele ID-generator voor request-tracing */
  generateId?: typeof generateId;
  /** Headers voor de calls naar Azure */
  headers?: () => Record<string, string | undefined>;
}

/**
 * Eigen ChatLanguageModel dat de Foundry-agent aanroept
 * Implementeert de LanguageModelV1 interface voor compatibiliteit met AI SDK
 */
export class CustomChatLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1";
  readonly defaultObjectGenerationMode = "json";
  readonly supportsImageUrls = false;

  private _foundryModelId: CustomChatModelId;
  private _settings: CustomChatSettings;
  private _config: AzureFoundryClientOptions;
  private _client: AIProjectsClient | null = null;

  constructor(modelId: CustomChatModelId, settings: CustomChatSettings, config: AzureFoundryClientOptions) {
    this._foundryModelId = modelId;
    this._settings = settings;
    this._config = config;
  }

  /**
   * Initializes the Azure AI Projects client
   */
  private getClient(): AIProjectsClient {
    if (!this._client) {
      this._client = AIProjectsClient.fromConnectionString(this._config.baseURL, this._config.credential ?? new DefaultAzureCredential());
    }
    return this._client;
  }

  /**
   * Creates a thread if needed
   * @returns The thread ID (either existing or newly created)
   */
  private async createThreadIfNeeded(): Promise<string> {
    // If thread ID is already specified and not empty, return it
    if (this._foundryModelId.threadId && this._foundryModelId.threadId !== "auto") {
      return this._foundryModelId.threadId;
    }

    // Create a new thread
    const client = this.getClient();
    const newThread = await client.agents.createThread({});

    // Update the model ID with the new thread ID
    this._foundryModelId.threadId = newThread.id;

    return newThread.id;
  }
  /**
   * ModelId property vereist door LanguageModelV1
   */
  get modelId(): string {
    const threadId = this._foundryModelId.threadId || "auto";
    return `${this._foundryModelId.agentId}:${threadId}`;
  }

  /**
   * Provider property vereist door LanguageModelV1
   */
  get provider(): string {
    return this._config.provider;
  }

  /**
   * Controleert of een URL wordt ondersteund
   */
  supportsUrl(url: URL): boolean {
    return url.protocol === "https:";
  }
  /**
   * Implementatie van niet-streaming generate methode
   */ async doGenerate(options: LanguageModelV1CallOptions): Promise<{
    text?: string;
    finishReason: "stop" | "length" | "content-filter" | "tool-calls";
    usage: { promptTokens: number; completionTokens: number };
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse: { body?: unknown; headers: Record<string, string> };
    request: { body?: string };
    warnings: LanguageModelV1CallWarning[];
  }> {
    const warnings: LanguageModelV1CallWarning[] = [];

    // Azure client initialiseren
    const client = this.getClient();

    // Create thread if needed
    const threadId = await this.createThreadIfNeeded();
    const { agentId } = this._foundryModelId;

    // Berichten doorgeven aan Azure Foundry
    const lastMessage = options.prompt[options.prompt.length - 1];
    await client.agents.createMessage(threadId, {
      role: lastMessage.role,
      content: typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content),
    });

    // Run starten en pollen
    let run = await client.agents.createRun(threadId, agentId);
    while (run.status === "queued" || run.status === "in_progress") {
      if (options.abortSignal?.aborted) {
        throw new Error("Request aborted");
      }
      await new Promise((r) => setTimeout(r, this._settings.pollIntervalMs ?? 1000));
      run = await client.agents.getRun(threadId, run.id);
    }

    // Alle assistant-berichten ophalen en samenvoegen
    const messages = await client.agents.listMessages(threadId);
    const text = messages.data
      .filter((m) => m.role === "assistant")
      .flatMap((m) =>
        m.content
          .filter((c) => c.type === "text")
          .map((c) => {
            if ("text" in c && typeof c.text === "object" && c.text && "value" in c.text) {
              return c.text.value;
            }
            return "";
          })
      )
      .join("\n");

    const usage = {
      promptTokens: run.usage?.promptTokens ?? 0,
      completionTokens: run.usage?.completionTokens ?? 0,
    };
    return {
      text,
      finishReason: "stop",
      usage,
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: { agentId: this._foundryModelId.agentId, threadId: this._foundryModelId.threadId },
      },
      rawResponse: {
        body: { messages: messages.data, run },
        headers: {},
      },
      request: {
        body: JSON.stringify(options),
      },
      warnings,
    };
  }
  /**
   * Implementatie van streaming generate methode
   */
  async doStream(options: LanguageModelV1CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse?: { headers: Record<string, string>; body?: unknown };
    request?: { body?: string };
    warnings?: LanguageModelV1CallWarning[];
  }> {
    const warnings: LanguageModelV1CallWarning[] = [];

    // Azure client initialiseren
    const client = this.getClient();

    // Create thread if needed
    const threadId = await this.createThreadIfNeeded();
    const { agentId } = this._foundryModelId;

    // Berichten doorgeven aan Azure Foundry
    const lastMessage = options.prompt[options.prompt.length - 1];
    await client.agents.createMessage(threadId, {
      role: lastMessage.role,
      content: typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content),
    });

    // Run starten
    const run = await client.agents.createRun(threadId, agentId);
    const pollIntervalMs = this._settings.pollIntervalMs ?? 1000;

    // Create a real streaming implementation
    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        // Metadata event
        controller.enqueue({
          type: "response-metadata",
          id: "azure-foundry-response-" + Date.now(),
          timestamp: new Date(),
          modelId: "azure-foundry-stream",
        });

        try {
          // Track the messages we've already processed and their content
          const processedMessageIds = new Set<string>();
          const processedContentIds = new Set<string>();
          let latestContent = "";
          let currentRun = run;

          // Poll for messages while the run is in progress
          while (currentRun.status === "queued" || currentRun.status === "in_progress") {
            if (options.abortSignal?.aborted) {
              throw new Error("Request aborted");
              break;
            }

            // Get the latest messages
            const messages = await client.agents.listMessages(threadId, { limit: 100, order: "asc" });

            // Process only assistant messages
            const assistantMessages = messages.data.filter((m) => m.role === "assistant");

            // Handle case where we have new messages
            for (const message of assistantMessages) {
              // For new messages, process all content
              if (!processedMessageIds.has(message.id)) {
                processedMessageIds.add(message.id);

                // Process each text content segment
                for (const contentItem of message.content.filter((c) => c.type === "text")) {
                  if ("text" in contentItem && typeof contentItem.text === "object" && contentItem.text && "value" in contentItem.text) {
                    const contentId = `${message.id}-${contentItem.text.value}`;
                    if (!processedContentIds.has(contentId)) {
                      processedContentIds.add(contentId);

                      // Only send new content as delta
                      const content = contentItem.text.value;
                      if (content !== latestContent) {
                        // If we have completely new content, send it as a delta
                        controller.enqueue({
                          type: "text-delta",
                          textDelta: content,
                        });
                        latestContent = content;
                      }
                    }
                  }
                }
              }
            }

            // Pause before checking again
            await new Promise((r) => setTimeout(r, pollIntervalMs));

            // Get the latest run status
            currentRun = await client.agents.getRun(threadId, run.id);
          }

          // Once complete, get usage information
          const usage = {
            promptTokens: currentRun.usage?.promptTokens ?? 0,
            completionTokens: currentRun.usage?.completionTokens ?? 0,
          };

          // Send finish event
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage,
          });
        } catch (error) {
          // Handle errors in the stream
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
    return {
      stream,
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          agentId: this._foundryModelId.agentId,
          threadId: threadId,
        },
      },
      rawResponse: { headers: {} },
      request: { body: JSON.stringify(options) },
      warnings,
    };
  }
}

/** Factory-signature van de provider */
export interface AzureFoundryProvider {
  (modelId: CustomChatModelId | string, settings?: CustomChatSettings): CustomChatLanguageModel;
  chat(modelId: CustomChatModelId | string, settings?: CustomChatSettings): CustomChatLanguageModel;
}

/** Provider-brede instellingen */
export interface AzureFoundryProviderSettings {
  /**
   * Azure AI Projects connection string
   */
  apiKey?: string;
  /**
   * Optioneel eigen TokenCredential (bv. ClientSecretCredential)
   */
  credential?: TokenCredential;
}

export function createAzureFoundryProvider(options: AzureFoundryProviderSettings = {}): AzureFoundryProvider {
  const createModel = (modelId: CustomChatModelId | string, settings: CustomChatSettings = {}) => {
    // laadt de connection string uit env of opties
    const connectionString = loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: "AZURE_AI_PROJECTS_CONNECTION_STRING",
      description: "Azure AI Projects connection string voor Foundry Agent Service",
    });

    // Convert string agentId to CustomChatModelId
    const chatModelId: CustomChatModelId = typeof modelId === "string" ? { agentId: modelId, threadId: "auto" } : modelId;

    return new CustomChatLanguageModel(chatModelId, settings, {
      provider: "azure.ai-foundry",
      baseURL: withoutTrailingSlash(connectionString) ?? connectionString,
      credential: options.credential,
      generateId,
    });
  };

  const provider = function (modelId: CustomChatModelId | string, settings?: CustomChatSettings) {
    if (new.target) {
      throw new Error("De model-factory mag niet met `new` worden aangeroepen");
    }
    return createModel(modelId, settings);
  };
  provider.chat = createModel;
  return provider as AzureFoundryProvider;
}

/** kant-en-klare instantie voor import */
export const azureFoundry = createAzureFoundryProvider();
