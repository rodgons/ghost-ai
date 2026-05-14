"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjectActions } from "@/hooks/use-project-actions";

type Project = {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
  subtitle: string;
};

type EditorHomeClientProps = {
  ownedProjects: Project[];
  sharedProjects: Project[];
};

export function EditorHomeClient({
  ownedProjects,
  sharedProjects,
}: EditorHomeClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const desktopQuery = globalThis.matchMedia("(min-width: 1024px)");
    const handleDesktopChange = (
      event: MediaQueryListEvent | MediaQueryList,
    ) => {
      if (event.matches) {
        setIsSidebarOpen(true);
      }
    };

    handleDesktopChange(desktopQuery);
    desktopQuery.addEventListener("change", handleDesktopChange);
    return () =>
      desktopQuery.removeEventListener("change", handleDesktopChange);
  }, []);

  const {
    dialogType,
    selectedProjectId,
    projectName,
    setProjectName,
    slugPreview,
    isSlugValid,
    isSubmitting,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleSubmit,
  } = useProjectActions();

  const handleRenameProject = (projectId: string) => {
    const project = ownedProjects.find((p) => p.id === projectId);
    if (project) {
      openRenameDialog(projectId, project.name);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    openDeleteDialog(projectId);
  };

  const selectedProject = ownedProjects.find((p) => p.id === selectedProjectId);

  return (
    <>
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={openCreateDialog}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      <main className="min-h-screen bg-bg-base pt-14">
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grow flex items-center justify-center rounded-3xl border border-border-default bg-bg-base/80 px-6 py-20 shadow-inner">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
              <h1 className="font-heading text-3xl font-semibold text-text-primary">
                Create a project or open an existing one
              </h1>
              <p className="max-w-xl text-sm text-text-muted">
                Start a new architecture workspace, or choose a project from the
                sidebar.
              </p>
              <Button size="lg" onClick={openCreateDialog}>
                <Plus />
                New Project
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Dialog
        open={dialogType !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {dialogType === "create" && "Create project"}
                {dialogType === "rename" && "Rename project"}
                {dialogType === "delete" && "Delete project"}
              </DialogTitle>
              <DialogDescription>
                {dialogType === "create" &&
                  "Enter a project name and preview the auto-generated slug before creating your workspace."}
                {dialogType === "rename" && selectedProject && (
                  <>
                    Rename <strong>{selectedProject.name}</strong> for a clearer
                    workspace label.
                  </>
                )}
                {dialogType === "delete" && selectedProject && (
                  <>
                    This will permanently remove{" "}
                    <strong>{selectedProject.name}</strong> from your owned
                    projects.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {(dialogType === "create" || dialogType === "rename") && (
              <div className="space-y-3">
                <Input
                  autoFocus={dialogType === "rename"}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Project name"
                  aria-label="Project name"
                />
                <p className="text-sm text-text-muted">
                  Slug preview:{" "}
                  <span className="font-medium text-text-primary">
                    {slugPreview || "—"}
                  </span>
                </p>
                {!isSlugValid && (
                  <p className="text-sm text-state-error">
                    Project name must include at least 3 letters or numbers to
                    generate a valid slug.
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              {dialogType === "create" && (
                <Button type="submit" disabled={isSubmitting || !isSlugValid}>
                  {isSubmitting ? "Creating…" : "Create project"}
                </Button>
              )}
              {dialogType === "rename" && (
                <Button type="submit" disabled={isSubmitting || !isSlugValid}>
                  {isSubmitting ? "Renaming…" : "Rename project"}
                </Button>
              )}
              {dialogType === "delete" && (
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting…" : "Delete project"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
