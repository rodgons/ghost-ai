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

  const clearScheduledSave = () => {
    if (timeout === null) {
      return;
    }

    clearTimeout(timeout);
    timeout = null;
  };

  return {
    dispose: () => {
      disposed = true;
      clearScheduledSave();
    },
    schedule: (snapshot) => {
      if (disposed) {
        return;
      }

      clearScheduledSave();
      timeout = setTimeout(() => {
        timeout = null;
        onStatusChange("saving");

        save(snapshot)
          .then(() => {
            if (!disposed) {
              onStatusChange("saved");
            }
          })
          .catch(() => {
            if (!disposed) {
              onStatusChange("error");
            }
          });
      }, delayMs);
    },
  };
}
