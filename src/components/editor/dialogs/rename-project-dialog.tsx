"use client";

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

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; name: string } | null;
  onRename: (id: string, name: string) => Promise<void>;
}
export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  onRename,
}: RenameProjectDialogProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(project?.name ?? "");
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !project) return;
    setIsLoading(true);
    try {
      await onRename(project.id, name.trim());
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Current name: <span className="font-medium">{project?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="rename-project-name"
                className="text-sm font-medium text-foreground"
              >
                Project name
              </label>
              <Input
                id="rename-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter project name"
                autoFocus
                disabled={isLoading || !project}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
