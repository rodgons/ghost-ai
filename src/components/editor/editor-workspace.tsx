"use client";

import { Bot, Share2 } from "lucide-react";
import { useState } from "react";
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
  ShareProjectDialog,
} from "@/components/editor/dialogs";
import { Button } from "@/components/ui/button";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { cn } from "@/lib/utils";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";

interface WorkspaceProps {
  ownedProjects: Array<{ id: string; name: string }>;
  sharedProjects: Array<{ id: string; name: string }>;

  projectId: string;
  projectName: string;
}

export function EditorWorkspace({
  ownedProjects,
  sharedProjects,
  projectId,
  projectName,
}: WorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const dialogs = useProjectDialogs();

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const toggleAiSidebar = () => setAiSidebarOpen((o) => !o);

  return (
    <div className="min-h-screen overflow-hidden bg-base text-primary">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        centerSection={<span className="font-medium">{projectName}</span>}
        rightSection={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleAiSidebar}
              aria-label="Toggle AI sidebar"
              aria-pressed={aiSidebarOpen}
            >
              <Bot className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          </div>
        }
      />

      <div className="flex pt-14">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={toggleSidebar}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={projectId}
          dialogs={dialogs}
        />

        <div className="flex min-h-[calc(100vh-3.5rem)] flex-1">
          {/* Main canvas placeholder */}
          <main className="flex flex-1 items-center justify-center bg-background">
            <p className="text-muted-foreground">Canvas coming soon</p>
          </main>

          {/* Right AI sidebar placeholder */}
          {aiSidebarOpen && (
            <aside
              className={cn(
                "w-80 border-l border-border bg-popover p-4",
                "flex flex-col",
              )}
            >
              <h3 className="mb-2 text-sm font-medium text-foreground">
                AI Chat (future)
              </h3>
              <div className="flex-1 text-muted-foreground">
                AI functionality not implemented yet.
              </div>
            </aside>
          )}
        </div>
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
      <ShareProjectDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        projectId={projectId}
        projectName={projectName}
      />
    </div>
  );
}
