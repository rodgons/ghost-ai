import assert from "node:assert/strict";
import test from "node:test";
import { createCanvasAutosaveScheduler } from "../src/hooks/canvas-autosave-scheduler";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("debounces canvas snapshots and reports save status", async () => {
  const savedSnapshots: string[] = [];
  const statuses: string[] = [];
  const scheduler = createCanvasAutosaveScheduler({
    delayMs: 10,
    onStatusChange: (status) => statuses.push(status),
    save: async (snapshot) => {
      savedSnapshots.push(snapshot);
    },
  });

  scheduler.schedule("snapshot-a");
  scheduler.schedule("snapshot-b");

  await wait(20);

  assert.deepEqual(savedSnapshots, ["snapshot-b"]);
  assert.deepEqual(statuses, ["saving", "saved"]);
  scheduler.dispose();
});

test("reports an error when a debounced canvas save fails", async () => {
  const statuses: string[] = [];
  const scheduler = createCanvasAutosaveScheduler({
    delayMs: 10,
    onStatusChange: (status) => statuses.push(status),
    save: async () => {
      throw new Error("save failed");
    },
  });

  scheduler.schedule("snapshot-a");

  await wait(20);

  assert.deepEqual(statuses, ["saving", "error"]);
  scheduler.dispose();
});
