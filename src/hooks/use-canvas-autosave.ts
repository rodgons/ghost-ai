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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveControllerRef = useRef<AbortController | null>(null);
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

    globalThis.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      saveControllerRef.current?.abort();
      clearSaveTimeout();
      return;
    }

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      return;
    }

    clearSaveTimeout();
    saveControllerRef.current?.abort();

    const requestSnapshot = serializedSnapshot;
    const controller = new AbortController();
    saveControllerRef.current = controller;

    saveTimeoutRef.current = globalThis.setTimeout(() => {
      if (controller.signal.aborted) {
        return;
      }

      setStatus("saving");

      fetch(`/api/projects/${projectId}/canvas`, {
        body: requestSnapshot,
        headers: { "Content-Type": "application/json" },
        method: "PUT",
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Canvas save failed.");
          }

          if (
            controller.signal.aborted ||
            saveControllerRef.current !== controller
          ) {
            return;
          }

          lastSavedSnapshotRef.current = requestSnapshot;
          setStatus("saved");
        })
        .catch((_error) => {
          if (
            controller.signal.aborted ||
            saveControllerRef.current !== controller
          ) {
            return;
          }

          setStatus("error");
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      controller.abort();
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
