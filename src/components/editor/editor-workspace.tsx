"use client";

import type { Project } from "@prisma/client";
import { Bot, LayoutGrid, Share2 } from "lucide-react";
import { useState } from "react";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorWorkspaceProps = {
  project: Project;
};

export function EditorWorkspace({ project }: EditorWorkspaceProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const toggleProjectSidebar = () => {
    setIsProjectSidebarOpen(!isProjectSidebarOpen);
  };

  const toggleAiSidebar = () => {
    setIsAiSidebarOpen(!isAiSidebarOpen);
  };

  const isOwner = true;

  // Empty arrays for now - will be populated when navigation is implemented
  const ownedProjects: {
    id: string;
    name: string;
    slug: string;
    isOwned: boolean;
    subtitle: string;
  }[] = [];
  const sharedProjects: {
    id: string;
    name: string;
    slug: string;
    isOwned: boolean;
    subtitle: string;
  }[] = [];

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-base">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-surface px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleProjectSidebar}
            aria-label="Toggle project sidebar"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">
              {project.name}
            </h1>
            <p className="text-xs text-text-muted">/{project.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
            <span className="ml-2">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAiSidebar}
            aria-label="Toggle AI assistant"
          >
            <Bot className="h-4 w-4" />
            <span className="ml-2">AI</span>
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Sidebar */}
        <ProjectSidebar
          isOpen={isProjectSidebarOpen}
          onClose={() => setIsProjectSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentProjectId={project.id}
          onCreateProject={() => {
            // TODO: Implement create project from workspace
          }}
          onRenameProject={() => {
            // TODO: Implement rename project
          }}
          onDeleteProject={() => {
            // TODO: Implement delete project
          }}
        />

        {/* Canvas Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full bg-bg-base flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-bg-surface border border-border-default">
                <svg
                  className="h-10 w-10 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 0H3m18 0h-2m2 0h-2M9 9h6m-6 0a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Canvas Placeholder
                </h2>
                <p className="mt-2 text-text-secondary max-w-md">
                  The collaborative canvas will appear here. This area will
                  display the React Flow canvas with Liveblocks integration.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* AI Sidebar */}
        <aside
          className={cn(
            "fixed right-0 top-14 bottom-0 w-80 border-l border-border-default bg-bg-surface transition-transform duration-300 ease-out",
            isAiSidebarOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Share Dialog */}
          <ShareDialog
            open={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
            projectId={project.id}
            isOwner={isOwner}
          />
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent-ai" />
                <span className="text-sm font-semibold text-text-primary">
                  AI Assistant
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAiSidebar}
                aria-label="Close AI sidebar"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-text-muted text-center">
                AI chat functionality coming soon.
                <br />
                This area will allow you to interact with the AI assistant.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
