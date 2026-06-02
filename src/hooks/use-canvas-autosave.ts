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
  paused?: boolean;
  projectId: string;
}

const AUTOSAVE_DEBOUNCE_MS = 3000;
const SAVED_STATUS_VISIBLE_MS = 2500;
const ERROR_STATUS_VISIBLE_MS = 2500;
const EMPTY_SERIALIZED_SNAPSHOT = JSON.stringify({ nodes: [], edges: [] });

export function useCanvasAutosave({
  edges,
  enabled,
  nodes,
  paused = false,
  projectId,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSaveSnapshotRef = useRef<string | null>(null);
  const hasInitializedSnapshotRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const queuedSaveSnapshotRef = useRef<string | null>(null);
  const saveSequenceRef = useRef(0);
  const errorStatusTimeoutRef = useRef<number | null>(null);
  const savedStatusTimeoutRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const snapshot = useMemo<CanvasSnapshot>(
    () => ({ nodes, edges }),
    [nodes, edges],
  );
  const serializedSnapshot = useMemo(
    () => JSON.stringify(snapshot),
    [snapshot],
  );

  const clearErrorStatusTimeout = useCallback(() => {
    if (errorStatusTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(errorStatusTimeoutRef.current);
    errorStatusTimeoutRef.current = null;
  }, []);

  const clearSavedStatusTimeout = useCallback(() => {
    if (savedStatusTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(savedStatusTimeoutRef.current);
    savedStatusTimeoutRef.current = null;
  }, []);

  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
  }, []);

  const saveSnapshot = useCallback(
    (snapshotToSave: string) => {
      if (isUnmountedRef.current) {
        return;
      }

      if (activeSaveSnapshotRef.current !== null) {
        queuedSaveSnapshotRef.current = snapshotToSave;
        return;
      }

      clearSavedStatusTimeout();
      clearErrorStatusTimeout();

      const saveSequence = saveSequenceRef.current + 1;
      saveSequenceRef.current = saveSequence;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      activeSaveSnapshotRef.current = snapshotToSave;
      setStatus("saving");

      fetch(`/api/projects/${projectId}/canvas`, {
        body: snapshotToSave,
        headers: { "Content-Type": "application/json" },
        method: "PUT",
        signal: abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Canvas save failed.");
          }

          if (saveSequenceRef.current !== saveSequence) {
            return;
          }

          lastSavedSnapshotRef.current = snapshotToSave;
          if (
            queuedSaveSnapshotRef.current === null ||
            queuedSaveSnapshotRef.current === snapshotToSave
          ) {
            clearErrorStatusTimeout();
            setStatus("saved");
            savedStatusTimeoutRef.current = window.setTimeout(() => {
              if (saveSequenceRef.current === saveSequence) {
                setStatus("idle");
              }
            }, SAVED_STATUS_VISIBLE_MS);
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          if (
            saveSequenceRef.current === saveSequence &&
            queuedSaveSnapshotRef.current === null
          ) {
            setStatus("error");
            errorStatusTimeoutRef.current = window.setTimeout(() => {
              if (saveSequenceRef.current === saveSequence) {
                setStatus("idle");
              }
            }, ERROR_STATUS_VISIBLE_MS);
          }
        })
        .finally(() => {
          activeSaveSnapshotRef.current = null;
          abortControllerRef.current = null;

          if (isUnmountedRef.current) {
            return;
          }

          const queuedSnapshot = queuedSaveSnapshotRef.current;
          queuedSaveSnapshotRef.current = null;

          if (
            queuedSnapshot !== null &&
            lastSavedSnapshotRef.current !== queuedSnapshot
          ) {
            saveSnapshot(queuedSnapshot);
          }
        });
    },
    [clearErrorStatusTimeout, clearSavedStatusTimeout, projectId],
  );

  const saveNow = useCallback(() => {
    if (!enabled || paused) {
      return;
    }

    clearSaveTimeout();
    saveSnapshot(serializedSnapshot);
  }, [clearSaveTimeout, enabled, paused, saveSnapshot, serializedSnapshot]);

  useEffect(() => {
    if (!enabled || paused) {
      clearSaveTimeout();
      return;
    }

    if (
      !hasInitializedSnapshotRef.current &&
      serializedSnapshot === EMPTY_SERIALIZED_SNAPSHOT
    ) {
      hasInitializedSnapshotRef.current = true;
      lastSavedSnapshotRef.current = serializedSnapshot;
      return;
    }

    if (!hasInitializedSnapshotRef.current) {
      hasInitializedSnapshotRef.current = true;
    }

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      return;
    }

    clearSaveTimeout();
    saveTimeoutRef.current = window.setTimeout(() => {
      saveSnapshot(serializedSnapshot);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearSaveTimeout();
    };
  }, [clearSaveTimeout, enabled, paused, saveSnapshot, serializedSnapshot]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      clearSaveTimeout();
      clearSavedStatusTimeout();
      clearErrorStatusTimeout();
      abortControllerRef.current?.abort();
    };
  }, [clearErrorStatusTimeout, clearSaveTimeout, clearSavedStatusTimeout]);

  return { saveNow, status };
}
