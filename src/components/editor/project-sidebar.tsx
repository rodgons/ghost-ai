import { Plus, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function EmptyProjectsPlaceholder({ text }: { text: string }) {
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

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
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

  const handleNewProject = useCallback(() => {
    // TODO: Implement new project modal / creation flow
  }, []);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        ref={asideRef}
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-sidebar-border bg-sidebar px-4 py-4 shadow-2xl shadow-black/20 transition-transform duration-300 ease-out",
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
          <TabsList className="w-full rounded-full bg-muted/60 p-[3px]">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="my-projects"
            className="mt-4 flex-1 overflow-hidden"
          >
            <EmptyProjectsPlaceholder text="My projects" />
          </TabsContent>

          <TabsContent value="shared" className="mt-4 flex-1 overflow-hidden">
            <EmptyProjectsPlaceholder text="Shared projects" />
          </TabsContent>
        </Tabs>

        <div className="mt-auto px-1 pb-2">
          {/* TODO: Implement new project modal / creation flow */}
          <Button
            className="w-full justify-center"
            size="default"
            onClick={handleNewProject}
          >
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
