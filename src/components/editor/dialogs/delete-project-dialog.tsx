"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
  } | null;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  onDelete,
}: DeleteProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{project?.name}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !project}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
