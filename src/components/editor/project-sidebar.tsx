"use client";

import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectDialogsState } from "@/hooks/use-project-dialogs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  dialogs?: ProjectDialogsState;
  ownedProjects: Array<{ id: string; name: string; slug: string }>;
  sharedProjects: Array<{ id: string; name: string; slug: string }>;
}

/**
 * Render the project sidebar containing workspace heading, tabbed "My Projects" and "Shared" panes, and a footer action.
 *
 * Renders a right-side collapsible panel that shows two tabs with empty-state placeholders and a "New Project" button. The panel's visibility, width, and slide-in transform are driven by `isOpen`.
 *
 * @param isOpen - Whether the sidebar is open (expanded) or closed (collapsed)
 * @param onClose - Callback invoked when the close button is clicked
 * @param id - Optional id applied to the aside element (defaults to `"editor-project-sidebar"`)
 * @returns The sidebar React element
 */
export function ProjectSidebar({
  isOpen,
  onClose,
  id = "editor-project-sidebar",
  dialogs,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  // Projects are passed in as props

  const handleCreateClick = () => {
    dialogs?.openCreateDialog();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <div
        className={cn(
          "relative h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r border-border transition-all duration-300 ease-out",
          isOpen ? "w-80" : "w-0 border-r-0",
        )}
        aria-hidden={!isOpen}
      >
        <aside
          id={id}
          className={cn(
            "flex h-full w-80 flex-col bg-popover text-popover-foreground transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Project sidebar"
          aria-labelledby="project-sidebar-title"
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
                Workspace
              </p>
              <h2
                id="project-sidebar-title"
                className="text-sm font-medium text-foreground"
              >
                Projects
              </h2>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close project sidebar"
              className="rounded-full"
            >
              <X className="h-4 w-4" suppressHydrationWarning />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <Tabs
              defaultValue="my-projects"
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList
                variant="line"
                className="w-full justify-start gap-2 px-4 pt-4"
              >
                <TabsTrigger
                  value="my-projects"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  My Projects
                </TabsTrigger>
                <TabsTrigger
                  value="shared"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  Shared
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-4 py-4">
                <TabsContent value="my-projects" className="mt-0">
                  {ownedProjects.length === 0 ? (
                    <EmptyState
                      title="No projects yet"
                      description="Create your first project to start building."
                      icon={
                        <FolderKanban
                          className="h-5 w-5"
                          suppressHydrationWarning
                        />
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {ownedProjects.map((project) => (
                        <ProjectItem
                          key={project.id}
                          project={project}
                          isOwned
                          onRename={() =>
                            dialogs?.openRenameDialog({
                              ...project,
                              isOwned: true,
                            })
                          }
                          onDelete={() =>
                            dialogs?.openDeleteDialog({
                              ...project,
                              isOwned: true,
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="shared" className="mt-0">
                  {sharedProjects.length === 0 ? (
                    <EmptyState
                      title="No shared projects"
                      description="Projects shared with you will appear here."
                      icon={
                        <FolderKanban
                          className="h-5 w-5"
                          suppressHydrationWarning
                        />
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {sharedProjects.map((project) => (
                        <ProjectItem
                          key={project.id}
                          project={project}
                          isOwned={false}
                          onRename={() => {}}
                          onDelete={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          <div className="border-t border-border p-4">
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={handleCreateClick}
            >
              <Plus className="h-4 w-4" suppressHydrationWarning />
              New Project
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

/**
 * Renders a centered empty-state card with an icon, title, and description.
 *
 * @param title - The main title text displayed in the card
 * @param description - The secondary descriptive text shown below the title
 * @param icon - A React node rendered inside the square icon container above the title
 * @returns A JSX element representing the empty-state card
 */
function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background text-foreground/70 ring-1 ring-border">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface ProjectItemProps {
  project: { id: string; name: string; slug: string };
  isOwned: boolean;
  onRename: () => void;
  onDelete: () => void;
}

function ProjectItem({
  project,
  isOwned,
  onRename,
  onDelete,
}: ProjectItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    // Focus first menu button when opened
    const firstBtn = menuRef.current?.querySelector("button");
    (firstBtn as HTMLElement | null)?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleRename = () => {
    setIsMenuOpen(false);
    onRename();
    triggerRef.current?.focus();
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete();
    triggerRef.current?.focus();
  };

  return (
    <div className="group flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-elevated">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {project.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{project.slug}</p>
      </div>
      {isOwned && (
        <div className="relative">
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            aria-label="Project actions"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            aria-controls={`menu-${project.id}`}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleMenu();
              }
            }}
            className="h-7 w-7"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {isMenuOpen && (
            <div
              ref={menuRef}
              id={`menu-${project.id}`}
              className="absolute right-0 top-full z-50 mt-1 min-w-[120px] flex-col rounded-lg border border-border bg-surface py-1 shadow-lg"
            >
              <button
                type="button"
                onClick={handleRename}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-elevated"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-error transition-colors hover:bg-error/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
