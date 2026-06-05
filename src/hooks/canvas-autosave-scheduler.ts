export type CanvasAutosaveSchedulerStatus = "saving" | "saved" | "error";

interface CanvasAutosaveSchedulerOptions {
  delayMs: number;
  onStatusChange: (status: CanvasAutosaveSchedulerStatus) => void;
  save: (snapshot: string) => Promise<void>;
}

export interface CanvasAutosaveScheduler {
  dispose: () => void;
  schedule: (snapshot: string) => void;
}

export function createCanvasAutosaveScheduler({
  delayMs,
  onStatusChange,
  save,
}: CanvasAutosaveSchedulerOptions): CanvasAutosaveScheduler {
  let disposed = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let inFlightSave = false;
  let latestPendingSnapshot: string | null = null;

  const clearScheduledSave = () => {
    if (timeout === null) {
      return;
    }

    clearTimeout(timeout);
    timeout = null;
  };

  const triggerSave = async () => {
    timeout = null;

    if (disposed || latestPendingSnapshot === null) {
      return;
    }

    const snapshotToSave = latestPendingSnapshot;
    latestPendingSnapshot = null;
    inFlightSave = true;
    onStatusChange("saving");

    try {
      await save(snapshotToSave);
      if (!disposed) {
        onStatusChange("saved");
      }
    } catch {
      if (!disposed) {
        onStatusChange("error");
      }
    } finally {
      inFlightSave = false;

      if (!disposed && latestPendingSnapshot !== null) {
        timeout = setTimeout(triggerSave, delayMs);
      }
    }
  };

  return {
    dispose: () => {
      disposed = true;
      clearScheduledSave();
      latestPendingSnapshot = null;
    },
    schedule: (snapshot) => {
      if (disposed) {
        return;
      }

      latestPendingSnapshot = snapshot;
      clearScheduledSave();

      if (!inFlightSave) {
        timeout = setTimeout(triggerSave, delayMs);
      }
    },
  };
}
