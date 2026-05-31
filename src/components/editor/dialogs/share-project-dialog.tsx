"use client";

import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import Image from "next/image";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
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

interface Collaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface CollaboratorsResponse {
  collaborators: Collaborator[];
  canManage: boolean;
}

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

function getInitials(collaborator: Collaborator) {
  const source = collaborator.displayName || collaborator.email;
  return source.slice(0, 2).toUpperCase();
}

function isCollaboratorsResponse(
  value: unknown,
): value is CollaboratorsResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<CollaboratorsResponse>;
  return Array.isArray(response.collaborators);
}

function isInviteResponse(
  value: unknown,
): value is { collaborator: Collaborator } {
  if (!value || typeof value !== "object") return false;
  const response = value as { collaborator?: Partial<Collaborator> };
  return typeof response.collaborator?.id === "string";
}

export function ShareProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ShareProjectDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [projectLink, setProjectLink] = useState("");

  useEffect(() => {
    setProjectLink(`${window.location.origin}/editor/${projectId}`);
  }, [projectId]);

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    async function loadCollaborators() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`,
        );
        if (!response.ok) {
          throw new Error("Unable to load collaborators.");
        }

        const data = (await response.json()) as unknown;
        if (!isCollaboratorsResponse(data)) {
          throw new Error("Unexpected collaborator response.");
        }

        if (!ignore) {
          setCollaborators(data.collaborators);
          setCanManage(data.canManage);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCollaborators();

    return () => {
      ignore = true;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const inviteCollaborator = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !canManage) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        throw new Error("Unable to invite collaborator.");
      }

      const data = (await response.json()) as unknown;
      if (!isInviteResponse(data)) {
        throw new Error("Unexpected invite response.");
      }

      const { collaborator } = data;
      setCollaborators((current) => {
        const remaining = current.filter(
          (currentCollaborator) => currentCollaborator.id !== collaborator.id,
        );
        return [...remaining, collaborator];
      });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!canManage) return;

    setRemovingId(collaboratorId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to remove collaborator.");
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.id !== collaboratorId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  };

  const copyProjectLink = async () => {
    if (!projectLink) return;

    try {
      await navigator.clipboard.writeText(projectLink);
      setCopied(true);
    } catch {
      setError("Unable to copy the project link.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Manage access for <span className="font-medium">{projectName}</span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 rounded-xl border border-border bg-background p-2">
            <Input value={projectLink} readOnly aria-label="Project link" />
            <Button
              type="button"
              variant="outline"
              onClick={copyProjectLink}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {canManage && (
            <form onSubmit={inviteCollaborator} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="collaborator@example.com"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Invite
              </Button>
            </form>
          )}

          {!canManage && (
            <p className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              You can view collaborators, but only the project owner can manage
              access.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              Collaborators
            </h3>

            {isLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collaborators
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
                No collaborators yet.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium text-foreground">
                      {collaborator.avatarUrl ? (
                        <Image
                          src={collaborator.avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(collaborator)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          collaborator.displayName
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {collaborator.displayName || collaborator.email}
                      </p>
                      {collaborator.displayName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {collaborator.email}
                        </p>
                      )}
                    </div>

                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${collaborator.email}`}
                        disabled={removingId === collaborator.id}
                        onClick={() => removeCollaborator(collaborator.id)}
                      >
                        {removingId === collaborator.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
