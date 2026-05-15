"use client";

import { Check, Copy, Loader2, Plus, Trash2, User } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Collaborator = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  isOwner: boolean;
};

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
};

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: Readonly<ShareDialogProps>) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!response.ok) {
        throw new Error("Failed to load collaborators");
      }
      const data = await response.json();
      setCollaborators(data.collaborators);
    } catch (err) {
      setError("Failed to load collaborators");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      loadCollaborators();
    } else {
      setEmail("");
      setError(null);
      setCopied(false);
    }
  }, [open, loadCollaborators]);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite collaborator");
      }

      setEmail("");
      await loadCollaborators();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (collaboratorEmail: string) => {
    if (!isOwner) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(
          collaboratorEmail,
        )}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (
          contentType?.includes("application/json") &&
          response.status !== 204
        ) {
          try {
            const data = await response.json();
            throw new Error(data.error || "Failed to remove collaborator");
          } catch {
            throw new Error(
              `Failed to remove collaborator: ${response.statusText}`,
            );
          }
        }
        throw new Error("Failed to remove collaborator");
      }

      await loadCollaborators();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${globalThis.location.origin}/editor/${projectId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleInvite();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators by email. Owners can manage access."
              : "View project collaborators."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isOwner && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email to invite"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="default"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus />
                )}
                Invite
              </Button>
            </form>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Collaborators</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoading && collaborators.length === 0 && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {collaborators.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No collaborators yet
                </div>
              )}
              {collaborators.length > 0 &&
                collaborators.map((collaborator) => {
                  const cardClass = collaborator.isOwner
                    ? "border-border-default bg-muted/50"
                    : "border-border-default bg-card";
                  return (
                    <div
                      key={collaborator.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border p-3",
                        cardClass,
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
                          suppressHydrationWarning
                        >
                          {collaborator.avatarUrl ? (
                            <Image
                              src={collaborator.avatarUrl}
                              alt={
                                collaborator.displayName || collaborator.email
                              }
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                              suppressHydrationWarning
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {collaborator.displayName || collaborator.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {collaborator.email}
                          </p>
                        </div>
                      </div>
                      {collaborator.isOwner && (
                        <span className="text-xs font-medium text-muted-foreground">
                          Owner
                        </span>
                      )}
                      {isOwner && !collaborator.isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(collaborator.email)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
