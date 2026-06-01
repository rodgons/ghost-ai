"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";
import type { CanvasEdge, CanvasNode } from "../../types/canvas";

interface UseKeyboardShortcutsOptions {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  redo: () => void;
  undo: () => void;
}

const ZOOM_DURATION_MS = 180;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.isContentEditable ||
      target.closest(
        "input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only']",
      ),
  );
}

export function useKeyboardShortcuts({
  reactFlow,
  redo,
  undo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const hasModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (hasModifier && key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (hasModifier && key === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if (hasModifier && key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (!hasModifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
        return;
      }

      if (!hasModifier && event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactFlow, redo, undo]);
}
