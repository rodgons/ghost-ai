"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export interface Project {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export interface ProjectDialogsState {
  isCreateDialogOpen: boolean;
  isRenameDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedProject: Project | null;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  closeRenameDialog: () => void;
  openDeleteDialog: (project: Project) => void;
  closeDeleteDialog: () => void;
  createProject: (name: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

export function useProjectDialogs(): ProjectDialogsState {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const openCreateDialog = () => setIsCreateDialogOpen(true);
  const closeCreateDialog = () => setIsCreateDialogOpen(false);

  const openRenameDialog = (project: Project) => {
    setSelectedProject(project);
    setIsRenameDialogOpen(true);
  };

  const closeRenameDialog = () => {
    setSelectedProject(null);
    setIsRenameDialogOpen(false);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setSelectedProject(null);
    setIsDeleteDialogOpen(false);
  };

  // Create project
  const createProject = async (name: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = await res.json();
      // Assuming workspace URL pattern is /editor/[id]
      router.push(`/editor/${data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rename project
  const renameProject = async (id: string, name: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete project
  const deleteProject = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      // Redirect only if currently viewing the deleted project
      if (pathname.startsWith(`/editor/${id}`)) {
        router.push("/editor");
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isCreateDialogOpen,
    isRenameDialogOpen,
    isDeleteDialogOpen,
    selectedProject,
    openCreateDialog,
    closeCreateDialog,
    openRenameDialog,
    closeRenameDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createProject,
    renameProject,
    deleteProject,
    // expose loading state if needed
    isSubmitting,
  };
}
