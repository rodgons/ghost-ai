"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Bot, LayoutTemplate, Save, Share2 } from "lucide-react";
import { useState } from "react";
import { CanvasErrorBoundary } from "~/components/editor/canvas-error-boundary";
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
  ShareProjectDialog,
} from "~/components/editor/dialogs";
import { Button } from "~/components/ui/button";
import type { CanvasSaveStatus } from "~/hooks/use-canvas-autosave";
import { useProjectDialogs } from "~/hooks/use-project-dialogs";
import type { CanvasSnapshot } from "../../../types/canvas";
import { AIWorkspaceSidebar } from "./ai-workspace-sidebar";
import {
  type CanvasTemplateImportRequest,
  CollaborativeCanvas,
} from "./collaborative-canvas";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import type { CanvasTemplate } from "./starter-templates";
import { StarterTemplatesModal } from "./starter-templates-modal";

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
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasSaveStatus>("idle");
  const [canvasSnapshot, setCanvasSnapshot] = useState<CanvasSnapshot>({
    edges: [],
    nodes: [],
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [templateImportRequest, setTemplateImportRequest] =
    useState<CanvasTemplateImportRequest | null>(null);
  const dialogs = useProjectDialogs();

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const toggleAiSidebar = () => setAiSidebarOpen((o) => !o);
  const saveStatusLabel =
    canvasSaveStatus === "saving"
      ? "Saving"
      : canvasSaveStatus === "error"
        ? "Save error"
        : canvasSaveStatus === "saved"
          ? "Saved"
          : "Save";
  const importTemplate = (template: CanvasTemplate) => {
    setTemplateImportRequest({
      id: Date.now(),
      template,
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-base text-primary-text">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        centerSection={
          <span className="font-medium text-navbar-text">{projectName}</span>
        }
        rightSection={
          <div className="flex items-center gap-2">
            <Button
              aria-live="polite"
              disabled
              size="sm"
              variant="outline"
              className={
                canvasSaveStatus === "error"
                  ? "border-destructive/50 text-destructive"
                  : "border-navbar-border bg-navbar-control text-navbar-text hover:bg-navbar-control-hover hover:text-navbar-text"
              }
            >
              <Save className="mr-1 h-4 w-4" />
              {saveStatusLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplatesModalOpen(true)}
              className="border-navbar-border bg-navbar-control text-navbar-text hover:bg-navbar-control-hover hover:text-navbar-text"
            >
              <LayoutTemplate className="mr-1 h-4 w-4" />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleAiSidebar}
              aria-label="Toggle AI sidebar"
              aria-pressed={aiSidebarOpen}
              className="text-navbar-text hover:bg-navbar-control-hover hover:text-navbar-text"
            >
              <Bot className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="text-navbar-text hover:text-navbar-text"
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

        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={projectId}
            initialPresence={{ cursor: null, thinking: false }}
          >
            <CanvasErrorBoundary fallback={<SharedRoomConnectionError />}>
              <ClientSideSuspense fallback={<SharedRoomLoading />}>
                <div className="flex min-h-[calc(100vh-3.5rem)] flex-1">
                  <CollaborativeCanvas
                    onCanvasSnapshotChange={setCanvasSnapshot}
                    onSaveStatusChange={setCanvasSaveStatus}
                    projectId={projectId}
                    templateImportRequest={templateImportRequest}
                  />

                  <AIWorkspaceSidebar
                    canvasSnapshot={canvasSnapshot}
                    isOpen={aiSidebarOpen}
                    onClose={() => setAiSidebarOpen(false)}
                    roomId={projectId}
                  />
                </div>
              </ClientSideSuspense>
            </CanvasErrorBoundary>
          </RoomProvider>
        </LiveblocksProvider>
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
      <StarterTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        onImport={importTemplate}
      />
    </div>
  );
}

function SharedRoomLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
      Loading workspace...
    </div>
  );
}

function SharedRoomConnectionError() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 items-center justify-center bg-background p-6 text-center">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Workspace connection failed
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Check your connection and refresh the workspace.
        </p>
      </div>
    </div>
  );
}
