"use client";

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
}

export function useProjectDialogs(): ProjectDialogsState {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
  };
}
