"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CanvasEdge,
  CanvasNode,
  CanvasSnapshot,
} from "../../types/canvas";

export type CanvasSaveStatus = "idle" | "saved" | "saving" | "error";

interface UseCanvasAutosaveOptions {
  edges: CanvasEdge[];
  enabled: boolean;
  nodes: CanvasNode[];
  projectId: string;
}

const AUTOSAVE_DEBOUNCE_MS = 1000;

export function useCanvasAutosave({
  edges,
  enabled,
  nodes,
  projectId,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const snapshot = useMemo<CanvasSnapshot>(
    () => ({ nodes, edges }),
    [nodes, edges],
  );
  const serializedSnapshot = useMemo(
    () => JSON.stringify(snapshot),
    [snapshot],
  );

  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearSaveTimeout();
      return;
    }

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      return;
    }

    clearSaveTimeout();
    saveTimeoutRef.current = window.setTimeout(() => {
      setStatus("saving");

      fetch(`/api/projects/${projectId}/canvas`, {
        body: serializedSnapshot,
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Canvas save failed.");
          }

          lastSavedSnapshotRef.current = serializedSnapshot;
          setStatus("saved");
        })
        .catch(() => {
          setStatus("error");
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearSaveTimeout();
    };
  }, [clearSaveTimeout, enabled, projectId, serializedSnapshot]);

  useEffect(() => {
    return () => {
      clearSaveTimeout();
    };
  }, [clearSaveTimeout]);

  return status;
}
