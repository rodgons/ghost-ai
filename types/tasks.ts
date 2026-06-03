import { z } from "zod";

export const AI_CHAT_FEED_NAME = "ai-chat";
export const AI_STATUS_FEED_NAME = "ai-status-feed";

export type AiStatusFeedState = "error" | "idle" | "success" | "working";
export type AiStatusFeedScope = "design" | "spec";
export type AiChatMessageRole = "assistant" | "user";

export interface AiChatSenderPayload {
  avatarUrl: string;
  cursorColor: string;
  displayName: string;
  id: string;
}

export interface AiChatMessagePayload {
  content: string;
  id: string;
  role: "assistant" | "user";
  sender: AiChatSenderPayload;
  timestamp: number;
}

export const aiChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(4_000),
  id: z.string().trim().min(1),
  role: z.enum(["assistant", "user"]),
  sender: z.object({
    avatarUrl: z.string(),
    cursorColor: z.string(),
    displayName: z.string().trim().min(1),
    id: z.string().trim().min(1),
  }),
  timestamp: z.number().finite(),
});

export interface AiStatusFeedPayload {
  createdAt: number;
  id: string;
  scope: "design" | "spec";
  state: "error" | "idle" | "success" | "working";
  text?: string;
}

const AI_STATUS_FEED_STATES = ["error", "idle", "success", "working"];
const AI_STATUS_FEED_SCOPES = ["design", "spec"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAiStatusFeedState(value: unknown): value is AiStatusFeedState {
  return typeof value === "string" && AI_STATUS_FEED_STATES.includes(value);
}

function isAiStatusFeedScope(value: unknown): value is AiStatusFeedScope {
  return typeof value === "string" && AI_STATUS_FEED_SCOPES.includes(value);
}

export function parseAiStatusFeedPayload(
  value: unknown,
): AiStatusFeedPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.createdAt !== "number" ||
    !Number.isFinite(value.createdAt) ||
    !isAiStatusFeedScope(value.scope) ||
    !isAiStatusFeedState(value.state)
  ) {
    return null;
  }

  if (value.text !== undefined && typeof value.text !== "string") {
    return null;
  }

  return {
    createdAt: value.createdAt,
    id: value.id,
    scope: value.scope,
    state: value.state,
    text: value.text,
  };
}

export function parseAiChatMessagePayload(
  value: unknown,
): AiChatMessagePayload | null {
  const result = aiChatMessageSchema.safeParse(value);

  return result.success ? result.data : null;
}
