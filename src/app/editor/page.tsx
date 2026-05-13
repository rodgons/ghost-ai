"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
      />
      <ProjectSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-h-screen bg-background pt-14">
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Editor Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Use the sidebar toggle to open project navigation. This shell frames the editor experience and keeps the canvas content stable.
            </p>
          </section>

          <section className="grow rounded-3xl border border-border bg-background/80 p-6 shadow-inner">
            <div className="h-[calc(100vh-18rem)] rounded-3xl border border-border/50 bg-muted/40 p-8 text-muted-foreground">
              Editor canvas placeholder
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
