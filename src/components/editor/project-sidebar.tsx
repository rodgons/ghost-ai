import { Pencil, Plus, Trash2, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
  subtitle: string;
};

type ProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: Project[];
  sharedProjects: Project[];
  onCreateProject: () => void;
  onRenameProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
};

function EmptyProjectsPlaceholder({ text }: Readonly<{ text: string }>) {
  return (
    <Card className="rounded-3xl border border-border-default bg-bg-base/80 px-4 py-6">
      <CardContent className="space-y-3 text-center">
        <CardTitle className="text-base">No {text} yet</CardTitle>
        <CardDescription>
          Create a new project or open a shared workspace to get started.
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function ProjectItem({
  project,
  onRename,
  onDelete,
}: Readonly<{
  project: Project;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}>) {
  return (
    <div className="rounded-3xl border border-border-default bg-bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-text-primary">{project.name}</p>
          <p className="mt-1 text-sm text-text-muted">/{project.slug}</p>
        </div>
        <span className="rounded-full border border-border-default bg-muted px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {project.isOwned ? "Owned" : "Shared"}
        </span>
      </div>

      <p className="mt-3 text-sm text-text-muted">{project.subtitle}</p>

      {project.isOwned ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onRename(project.id)}
          >
            <Pencil />
            Rename
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: Readonly<ProjectSidebarProps>) {
  const asideRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (asideRef.current) {
      asideRef.current.inert = !isOpen;
      asideRef.current.setAttribute("aria-hidden", String(!isOpen));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close projects sidebar"
        className={cn(
          "fixed inset-x-0 top-14 bottom-0 left-0 z-30 bg-black/20 backdrop-blur-sm sm:backdrop-blur-none transition-opacity duration-300",
          isOpen
            ? "opacity-100 sm:opacity-0 sm:pointer-events-none"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        ref={asideRef}
        className={cn(
          "fixed top-14 bottom-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-sidebar-border bg-sidebar px-4 py-4 shadow-2xl shadow-black/20 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-4 pb-3">
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">
              Projects
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Close projects sidebar"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="flex flex-col gap-3">
          <TabsList className="w-full rounded-full bg-muted/60 p-0.75">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="my-projects"
            className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1"
          >
            {ownedProjects.length > 0 ? (
              ownedProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                />
              ))
            ) : (
              <EmptyProjectsPlaceholder text="My projects" />
            )}
          </TabsContent>

          <TabsContent
            value="shared"
            className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1"
          >
            {sharedProjects.length > 0 ? (
              sharedProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onRename={() => undefined}
                  onDelete={() => undefined}
                />
              ))
            ) : (
              <EmptyProjectsPlaceholder text="Shared projects" />
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-auto px-1 pb-2">
          <Button
            className="w-full justify-center"
            size="default"
            onClick={onCreateProject}
          >
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
