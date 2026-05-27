"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface EditorContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * Provides editor UI state to descendant components and manages the sidebar open state.
 *
 * @param children - React nodes rendered within the provider
 * @returns A React provider element that supplies `sidebarOpen`, `setSidebarOpen`, and `toggleSidebar` to descendant components via `EditorContext`
 */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <EditorContext.Provider
      value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}
    >
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Accesses the current editor context.
 *
 * @returns The editor context containing `sidebarOpen`, `setSidebarOpen`, and `toggleSidebar`.
 * @throws Error if called outside an EditorProvider.
 */
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
