"use client";

import { UserButton } from "@clerk/nextjs";
import { EditorProvider, useEditor } from "@/components/editor/editor-context";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

function EditorWorkspace() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useEditor();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        rightSection={
          <div className="flex items-center gap-2">
            <UserButton />
          </div>
        }
      />

      <div className="flex pt-14">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Editor
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Protected editor workspace. Your account controls and profile menu
              are available from the top-right user menu.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorWorkspace />
    </EditorProvider>
  );
}
