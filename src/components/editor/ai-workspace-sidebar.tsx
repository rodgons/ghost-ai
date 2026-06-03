"use client";

import { Bot, Download, FileText, Send, X } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

interface AIWorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
}

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
  onPromptSelect,
}: {
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

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm",
          isUser
            ? "border-2 border-brand/50 bg-brand-dim text-copy-primary"
            : "border border-surface-border bg-elevated text-accent-text",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function AIArchitectTab() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const submitPrompt = (prompt: string) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const createdAt = Date.now();
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createdAt,
        role: "user",
        content: trimmedPrompt,
      },
      {
        id: createdAt + 1,
        role: "assistant",
        content:
          "I can help shape this architecture once AI generation is connected.",
      },
    ]);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "72px";
    }
  };

  const handleSubmit = () => {
    submitPrompt(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <SidebarSection className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <EmptyArchitectState onPromptSelect={submitPrompt} />
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection className="p-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextarea(event.currentTarget);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Ghost AI to design or refine this system..."
          className="max-h-40 min-h-[72px] resize-none border-surface-border bg-subtle text-copy-primary placeholder:text-muted-text"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="bg-brand text-white hover:bg-brand/90"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send
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
}: AIWorkspaceSidebarProps) {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-30 pt-16">
      <aside
        aria-label="AI workspace sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "mr-4 flex h-[calc(100vh-5rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col rounded-3xl border border-surface-border bg-base/95 p-4 text-copy-primary shadow-2xl backdrop-blur transition-all duration-300 ease-out",
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        )}
      >
        <div className="flex items-start gap-3 border-b border-surface-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-dim text-brand">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-primary-text">
              AI Workspace
            </h2>
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
          className="mt-4 flex min-h-0 flex-1 flex-col gap-3"
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

          <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1">
            <AIArchitectTab />
          </TabsContent>
          <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1">
            <SpecsTab />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
