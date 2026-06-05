import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("SyncedCanvas avoids compiler-generated variable-length hook dependencies", () => {
  const source = readFileSync(
    "src/components/editor/collaborative-canvas.tsx",
    "utf8",
  );

  assert.match(source, /function SyncedCanvas\([\s\S]*?\) \{\s+"use no memo";/);
});

test("React Flow receives module-scoped node and edge type maps", () => {
  const source = readFileSync(
    "src/components/editor/collaborative-canvas.tsx",
    "utf8",
  );

  assert.doesNotMatch(source, /stableNodeTypes|stableEdgeTypes/);
  assert.match(source, /nodeTypes=\{canvasNodeTypes\}/);
  assert.match(source, /edgeTypes=\{canvasEdgeTypes\}/);
});
