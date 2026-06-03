"use client";

import {
  shallow,
  useBroadcastEvent,
  useEventListener,
  useOthers,
  useSelf,
} from "@liveblocks/react/suspense";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Bot, Download, FileText, Loader2, Send, X } from "lucide-react";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { designAgent } from "~/trigger/design-agent";
import { NODE_COLORS } from "../../../types/canvas";
import {
  AI_CHAT_FEED_NAME,
  AI_STATUS_FEED_NAME,
  type AiChatMessagePayload,
  type AiStatusFeedPayload,
  parseAiChatMessagePayload,
  parseAiStatusFeedPayload,
} from "../../../types/tasks";

interface AIWorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface ActiveDesignRun {
  publicToken: string;
  runId: string;
}

interface DesignAgentApiResponse {
  publicToken: string;
  runId: string;
}

interface AiChatHistoryResponse {
  messages: AiChatMessagePayload[];
}

const AI_CHAT_ACCENT = NODE_COLORS[6];
const AI_SENDER = {
  avatarUrl: "",
  cursorColor: AI_CHAT_ACCENT.text,
  displayName: "Ghost AI",
  id: "ghost-ai",
} satisfies AiChatMessagePayload["sender"];

const TERMINAL_RUN_STATUSES = new Set([
  "CANCELED",
  "COMPLETED",
  "CRASHED",
  "EXPIRED",
  "FAILED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
]);

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

function SidebarSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-elevated",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EmptyArchitectState({
  isAiWorking,
  onPromptSelect,
}: {
  isAiWorking: boolean;
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dim text-brand">
        <Bot className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-primary-text">
        Start with a system prompt
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-text">
        Ask Ghost AI to draft architecture ideas for the current canvas.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isAiWorking}
            className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:bg-brand-dim"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatChatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function sortChatMessages(messages: AiChatMessagePayload[]) {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

function mergeChatMessages(
  currentMessages: AiChatMessagePayload[],
  incomingMessages: AiChatMessagePayload[],
) {
  const messagesById = new Map<string, AiChatMessagePayload>();

  for (const message of currentMessages) {
    messagesById.set(message.id, message);
  }

  for (const message of incomingMessages) {
    messagesById.set(message.id, message);
  }

  return sortChatMessages([...messagesById.values()]);
}

function isAiChatHistoryResponse(
  value: unknown,
): value is AiChatHistoryResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !Array.isArray((value as Record<string, unknown>).messages)
  ) {
    return false;
  }

  return (value as { messages: unknown[] }).messages.every((message) =>
    Boolean(parseAiChatMessagePayload(message)),
  );
}

function isDesignAgentApiResponse(
  value: unknown,
): value is DesignAgentApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).runId === "string" &&
    Boolean((value as Record<string, unknown>).runId) &&
    typeof (value as Record<string, unknown>).publicToken === "string" &&
    Boolean((value as Record<string, unknown>).publicToken)
  );
}

function readApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).error === "string"
  ) {
    return (value as Record<string, string>).error;
  }

  return "Ghost AI could not start the design run.";
}

function normalizeRunStatus(status: unknown) {
  return typeof status === "string" ? status.toUpperCase() : "";
}

function isTerminalRunStatus(status: unknown) {
  return TERMINAL_RUN_STATUSES.has(normalizeRunStatus(status));
}

function ChatBubble({
  currentUserId,
  message,
}: {
  currentUserId: string | null;
  message: AiChatMessagePayload;
}) {
  const isUser = message.sender.id === currentUserId;

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className="min-w-0 max-w-[86%]">
        <div
          className={cn(
            "mb-1 flex min-w-0 items-center gap-2 px-1 text-[11px] text-muted-text",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span className="max-w-28 truncate font-medium">
            {message.sender.displayName}
          </span>
          <span>{formatChatTimestamp(message.timestamp)}</span>
        </div>
        <div
          className={cn(
            "overflow-hidden break-words rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm",
            isUser
              ? "border border-transparent"
              : "border border-surface-border bg-elevated text-copy-primary",
          )}
          style={
            isUser
              ? {
                  backgroundColor: AI_CHAT_ACCENT.text,
                  color: AI_CHAT_ACCENT.fill,
                }
              : undefined
          }
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function useSharedAiActivity() {
  const [latestStatus, setLatestStatus] = useState<AiStatusFeedPayload | null>(
    null,
  );
  const isAiWorking = useOthers(
    (others) => others.some((other) => Boolean(other.presence.thinking)),
    shallow,
  );

  useEventListener(({ event }) => {
    if (event.type !== AI_STATUS_FEED_NAME) {
      return;
    }

    const payload = parseAiStatusFeedPayload(event.payload);

    if (!payload) {
      return;
    }

    setLatestStatus(payload);
  });

  return { isAiWorking, latestStatus };
}

function AiActivityStatus({
  isAiWorking,
  latestStatus,
}: {
  isAiWorking: boolean;
  latestStatus: AiStatusFeedPayload | null;
}) {
  const statusText =
    latestStatus?.text ??
    (isAiWorking ? "Ghost AI is working." : "Ghost AI is ready.");

  return (
    <div
      aria-live="polite"
      className="flex min-h-9 min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border border-surface-border bg-elevated px-3 py-2 text-xs text-muted-text"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: isAiWorking
            ? AI_CHAT_ACCENT.text
            : "var(--text-muted)",
        }}
      />
      {isAiWorking ? (
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin"
          style={{ color: AI_CHAT_ACCENT.text }}
        />
      ) : null}
      <span className="min-w-0 truncate">{statusText}</span>
    </div>
  );
}

function AIArchitectTab({
  isAiWorking,
  latestStatus,
  roomId,
}: {
  isAiWorking: boolean;
  latestStatus: AiStatusFeedPayload | null;
  roomId: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessagePayload[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const broadcast = useBroadcastEvent();
  const self = useSelf();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const finalizedRunIdsRef = useRef<Set<string>>(new Set());
  const currentUserId = self?.id ?? null;
  const isRunActive = Boolean(activeRun);
  const isInputDisabled = isAiWorking || isRunActive || isSending;
  const chatApiUrl = `/api/projects/${encodeURIComponent(roomId)}/ai-chat`;

  const addMessage = useCallback((message: AiChatMessagePayload) => {
    setMessages((currentMessages) =>
      mergeChatMessages(currentMessages, [message]),
    );
  }, []);

  const persistMessage = useCallback(
    async (message: AiChatMessagePayload) => {
      const response = await fetch(chatApiUrl, {
        body: JSON.stringify(message),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Chat message could not be saved.");
      }
    },
    [chatApiUrl],
  );

  const broadcastMessage = useCallback(
    (message: AiChatMessagePayload) => {
      broadcast({
        payload: message,
        type: AI_CHAT_FEED_NAME,
      });
      addMessage(message);
    },
    [addMessage, broadcast],
  );

  const broadcastAssistantMessage = useCallback(
    async (content: string) => {
      const message: AiChatMessagePayload = {
        content,
        id: crypto.randomUUID(),
        role: "assistant",
        sender: AI_SENDER,
        timestamp: Date.now(),
      };

      broadcastMessage(message);
      await persistMessage(message);
    },
    [broadcastMessage, persistMessage],
  );

  const finishRun = useCallback(
    (runId: string, status: unknown, error?: Error) => {
      if (finalizedRunIdsRef.current.has(runId)) {
        return;
      }

      finalizedRunIdsRef.current.add(runId);

      const normalizedStatus = isTerminalRunStatus(status)
        ? normalizeRunStatus(status)
        : "FAILED";
      const content =
        error || normalizedStatus !== "COMPLETED"
          ? `Design run failed${normalizedStatus ? ` (${normalizedStatus.toLowerCase()})` : ""}. ${error?.message ?? "Check the Trigger.dev run for details."}`
          : "Design update complete. Canvas changes will appear live in this room.";

      void broadcastAssistantMessage(content).catch((messageError) => {
        setSendError(
          messageError instanceof Error ? messageError.message : content,
        );
      });

      setActiveRun((currentRun) =>
        currentRun?.runId === runId ? null : currentRun,
      );
      setIsSending(false);
    },
    [broadcastAssistantMessage],
  );

  const { error: realtimeError } = useRealtimeRun<typeof designAgent>(
    activeRun?.runId,
    {
      accessToken: activeRun?.publicToken,
      enabled: Boolean(activeRun),
      onComplete: (run, error) => {
        const runId = run.id ?? activeRun?.runId;

        if (!runId) {
          return;
        }

        finishRun(runId, run.status, error);
      },
    },
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadChatHistory() {
      const response = await fetch(chatApiUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Saved chat history could not be loaded.");
      }

      const responseBody: unknown = await response.json().catch(() => null);

      if (!isAiChatHistoryResponse(responseBody)) {
        throw new Error("Saved chat history is invalid.");
      }

      const parsedMessages = responseBody.messages
        .map(parseAiChatMessagePayload)
        .filter((message): message is AiChatMessagePayload => Boolean(message));

      setMessages((currentMessages) =>
        mergeChatMessages(currentMessages, parsedMessages),
      );
    }

    void loadChatHistory().catch((error) => {
      if (controller.signal.aborted) {
        return;
      }

      setSendError(
        error instanceof Error ? error.message : "Chat history failed to load.",
      );
    });

    return () => controller.abort();
  }, [chatApiUrl]);

  useEffect(() => {
    if (!activeRun || !realtimeError) {
      return;
    }

    finishRun(activeRun.runId, "FAILED", realtimeError);
  }, [activeRun, finishRun, realtimeError]);

  useEventListener(({ event }) => {
    if (event.type !== AI_CHAT_FEED_NAME) {
      return;
    }

    const payload = parseAiChatMessagePayload(event.payload);

    if (!payload) {
      return;
    }

    setMessages((currentMessages) =>
      mergeChatMessages(currentMessages, [payload]),
    );
  });

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const submitPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isInputDisabled || !self) {
      return;
    }

    setSendError(null);
    setIsSending(true);

    const timestamp = Date.now();
    const message: AiChatMessagePayload = {
      content: trimmedPrompt,
      id: crypto.randomUUID(),
      role: "user",
      sender: {
        avatarUrl: self.info.avatarUrl,
        cursorColor: self.info.cursorColor,
        displayName: self.info.displayName,
        id: self.id,
      },
      timestamp,
    };

    try {
      broadcastMessage(message);
      await persistMessage(message);
      setInput("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "72px";
      }

      const response = await fetch("/api/ai/design", {
        body: JSON.stringify({
          prompt: trimmedPrompt,
          roomId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(readApiError(responseBody));
      }

      if (!isDesignAgentApiResponse(responseBody)) {
        throw new Error("Ghost AI returned an invalid run token.");
      }

      finalizedRunIdsRef.current.delete(responseBody.runId);
      setActiveRun(responseBody);
      setIsSending(false);
    } catch (error) {
      const content =
        error instanceof Error
          ? error.message
          : "Ghost AI could not start the design run.";

      try {
        await broadcastAssistantMessage(content);
      } catch {
        setSendError(content);
      }

      setIsSending(false);
    }
  };

  const handleSubmit = () => {
    void submitPrompt(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <SidebarSection className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex h-full min-w-0 flex-col">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            {messages.length === 0 ? (
              <EmptyArchitectState
                isAiWorking={isInputDisabled}
                onPromptSelect={submitPrompt}
              />
            ) : (
              <div className="min-w-0 space-y-3">
                {messages.map((message) => (
                  <ChatBubble
                    currentUserId={currentUserId}
                    key={message.id}
                    message={message}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection className="min-w-0 overflow-hidden p-3">
        {isRunActive ? (
          <div className="mb-3 min-w-0">
            <AiActivityStatus
              isAiWorking={isAiWorking}
              latestStatus={latestStatus}
            />
          </div>
        ) : null}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextarea(event.currentTarget);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Ghost AI to design or refine this system..."
          disabled={isInputDisabled}
          className="max-h-40 min-h-[72px] w-full resize-none border-surface-border bg-subtle text-copy-primary placeholder:text-muted-text"
          rows={3}
        />
        <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-error" aria-live="polite">
            {sendError}
          </p>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isInputDisabled}
            className="shrink-0 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={
              !input.trim() || isInputDisabled
                ? undefined
                : {
                    backgroundColor: AI_CHAT_ACCENT.text,
                    color: AI_CHAT_ACCENT.fill,
                  }
            }
          >
            {isInputDisabled ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {isRunActive || isAiWorking
              ? "Working"
              : isSending
                ? "Sending"
                : "Send"}
          </Button>
        </div>
      </SidebarSection>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Button
        type="button"
        className="w-full bg-brand text-white hover:bg-brand/90"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        Generate Spec
      </Button>

      <SidebarSection className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dim text-brand">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-primary-text">
              System Architecture Spec
            </h3>
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-text">
              Overview, component responsibilities, data flow, and operational
              notes generated from the current canvas.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          className="mt-4 w-full border-surface-border text-muted-text"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </Button>
      </SidebarSection>
    </div>
  );
}

export function AIWorkspaceSidebar({
  isOpen,
  onClose,
  roomId,
}: AIWorkspaceSidebarProps) {
  const { isAiWorking, latestStatus } = useSharedAiActivity();

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-30 max-w-full pt-16">
      <aside
        aria-label="AI workspace sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "mr-4 flex h-[calc(100vh-5rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-surface-border bg-base/95 p-4 text-copy-primary shadow-2xl backdrop-blur transition-all duration-300 ease-out",
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        )}
      >
        <div className="flex min-w-0 items-start gap-3 border-b border-surface-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-dim text-brand">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="min-w-0 truncate text-sm font-semibold text-primary-text">
                AI Workspace
              </h2>
              {isAiWorking ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-dim px-2 py-0.5 text-[11px] font-medium text-brand">
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    aria-hidden="true"
                  />
                  Working
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-text">
              Collaborate with Ghost AI
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI workspace"
            className="rounded-full text-muted-text hover:text-primary-text"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <Tabs
          defaultValue="architect"
          className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
        >
          <TabsList className="grid h-9 w-full grid-cols-2 bg-subtle p-1">
            <TabsTrigger
              value="architect"
              className="text-muted-text data-active:bg-brand-dim data-active:text-brand"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-muted-text data-active:bg-brand-dim data-active:text-brand"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="architect"
            className="mt-0 flex min-h-0 min-w-0 flex-1 overflow-hidden"
          >
            <AIArchitectTab
              isAiWorking={isAiWorking}
              latestStatus={latestStatus}
              roomId={roomId}
            />
          </TabsContent>
          <TabsContent
            value="specs"
            className="mt-0 flex min-h-0 min-w-0 flex-1 overflow-hidden"
          >
            <SpecsTab />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
