"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  centerSection?: ReactNode;
  rightSection?: ReactNode;
  className?: string;
  sidebarId?: string;
}

export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  centerSection,
  rightSection,
  className,
  sidebarId = "editor-project-sidebar",
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 border-b border-border/70 bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className,
      )}
    >
      <div className="mx-auto flex h-full max-w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls={sidebarId}
            className="border border-border/60 bg-background/60 text-foreground hover:bg-muted"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            <span className="sr-only">
              {sidebarOpen ? "Close sidebar" : "Open sidebar"}
            </span>
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          {centerSection}
        </div>

        <div className="flex min-w-0 items-center justify-end">
          {rightSection}
        </div>
      </div>
    </header>
  );
}
