import { env, isMockAI } from "../config/env.js";
import { toOpenAITools } from "../tools/definitions.js";
import type { ToolCall } from "../types/index.js";

export interface ProviderMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ProviderResult {
  content: string;
  toolCalls: ToolCall[];
}

export interface AIProvider {
  name: string;
  mock: boolean;
  complete(messages: ProviderMessage[]): Promise<ProviderResult>;
}

export class RealAIProvider implements AIProvider {
  name: string;
  mock = false;
  private baseUrl: string;
  private model: string;
  private apiKey: string;

  constructor() {
    this.name = env.aiProvider;
    this.apiKey = env.aiApiKey;
    this.model = env.aiModel;
    if (env.aiBaseUrl) this.baseUrl = env.aiBaseUrl.replace(/\/$/, "");
    else if (env.aiProvider === "groq") this.baseUrl = "https://api.groq.com/openai/v1";
    else this.baseUrl = "https://api.openai.com/v1";
  }

  async complete(messages: ProviderMessage[]): Promise<ProviderResult> {
    const payload = {
      model: this.model,
      temperature: 0.3,
      messages: messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
        }
        if (m.toolCalls?.length) {
          return {
            role: "assistant",
            content: m.content || null,
            tool_calls: m.toolCalls.map((c) => ({
              id: c.id,
              type: "function",
              function: { name: c.name, arguments: JSON.stringify(c.arguments) },
            })),
          };
        }
        return { role: m.role, content: m.content };
      }),
      tools: toOpenAITools(),
      tool_choice: "auto",
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: {
        message: {
          content?: string;
          tool_calls?: { id: string; function: { name: string; arguments: string } }[];
        };
      }[];
    };
    const message = data.choices[0]?.message;
    const toolCalls: ToolCall[] = (message?.tool_calls ?? []).map((c) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(c.function.arguments || "{}");
      } catch {
        args = {};
      }
      return { id: c.id, name: c.function.name, arguments: args };
    });
    return { content: message?.content ?? "", toolCalls };
  }
}

export function getAIProvider(): AIProvider {
  if (isMockAI()) return { name: "mock", mock: true, complete: async () => ({ content: "", toolCalls: [] }) };
  return new RealAIProvider();
}
