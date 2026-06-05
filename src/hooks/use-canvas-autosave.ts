"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CanvasEdge,
  CanvasNode,
  CanvasSnapshot,
} from "../../types/canvas";
import { createCanvasAutosaveScheduler } from "./canvas-autosave-scheduler";

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
  const schedulerRef = useRef<ReturnType<
    typeof createCanvasAutosaveScheduler
  > | null>(null);
  const snapshot = useMemo<CanvasSnapshot>(
    () => ({ nodes, edges }),
    [nodes, edges],
  );
  const serializedSnapshot = useMemo(
    () => JSON.stringify(snapshot),
    [snapshot],
  );

  useEffect(() => {
    const scheduler = createCanvasAutosaveScheduler({
      delayMs: AUTOSAVE_DEBOUNCE_MS,
      onStatusChange: (nextStatus) => setStatus(nextStatus),
      save: async (snapshotToSave) => {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          body: snapshotToSave,
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        });

        if (!response.ok) {
          throw new Error("Canvas save failed.");
        }
      },
    });

    schedulerRef.current = scheduler;

    return () => {
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [projectId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    schedulerRef.current?.schedule(serializedSnapshot);
  }, [enabled, serializedSnapshot]);

  return status;
}
