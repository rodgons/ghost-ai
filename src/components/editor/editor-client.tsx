"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
} from "@/components/editor/dialogs";
import { useEditor } from "@/components/editor/editor-context";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

function EditorHome({ openCreateDialog }: { openCreateDialog: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Create a project or open an existing one
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Start a new architecture workspace, or choose a project from the
        sidebar.
      </p>
      <button
        type="button"
        onClick={openCreateDialog}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>
    </div>
  );
}
export function EditorClient({
  ownedProjects,
  sharedProjects,
}: {
  ownedProjects: Array<{ id: string; name: string }>;
  sharedProjects: Array<{ id: string; name: string }>;
}) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useEditor();
  const dialogs = useProjectDialogs();
  return (
    <div className="min-h-screen bg-base text-primary">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        rightSection={<UserButton />}
      />

      <div className="flex pt-14">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          dialogs={dialogs}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-6">
          <EditorHome openCreateDialog={dialogs.openCreateDialog} />
        </main>
      </div>

      <CreateProjectDialog
        open={dialogs.isCreateDialogOpen}
        onOpenChange={(open) => {
          open ? dialogs.openCreateDialog() : dialogs.closeCreateDialog();
        }}
        onCreate={dialogs.createProject}
      />
      <RenameProjectDialog
        open={dialogs.isRenameDialogOpen}
        onOpenChange={dialogs.closeRenameDialog}
        project={dialogs.selectedProject}
        onRename={dialogs.renameProject}
      />
      <DeleteProjectDialog
        open={dialogs.isDeleteDialogOpen}
        onOpenChange={dialogs.closeDeleteDialog}
        project={dialogs.selectedProject}
        onDelete={dialogs.deleteProject}
      />
    </div>
  );
}
