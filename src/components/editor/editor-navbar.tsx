"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
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

/**
 * Render a fixed top editor navigation bar with a sidebar toggle, an optional center slot, and an optional right slot.
 *
 * @param sidebarOpen - Whether the sidebar is currently open; controls toggle icon and ARIA expanded state.
 * @param onToggleSidebar - Click handler invoked to toggle the sidebar open/closed.
 * @param centerSection - Optional content to render centered in the navbar.
 * @param rightSection - Optional content to render aligned to the right of the navbar.
 * @param className - Additional CSS classes applied to the header element.
 * @param sidebarId - `aria-controls` target ID for the sidebar (defaults to `"editor-project-sidebar"`).
 * @returns The header element containing the editor navigation bar.
 */
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
        "fixed inset-x-0 top-0 z-50 h-14 border-b border-navbar-border bg-navbar-bg px-4 text-navbar-text backdrop-blur supports-[backdrop-filter]:bg-navbar-bg",
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
            className="border border-navbar-border bg-navbar-control text-navbar-text hover:bg-navbar-control-hover hover:text-navbar-text"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" suppressHydrationWarning />
            ) : (
              <PanelLeftOpen className="h-4 w-4" suppressHydrationWarning />
            )}
            <span className="sr-only">
              {sidebarOpen ? "Close sidebar" : "Open sidebar"}
            </span>
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center text-navbar-text">
          {centerSection}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 text-navbar-text">
          <ThemeToggle />
          {rightSection}
        </div>
      </div>
    </header>
  );
}
