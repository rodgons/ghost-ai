import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("Specs tab starts spec generation from the Generate Spec button", () => {
  const sidebarSource = readFileSync(
    "src/components/editor/ai-workspace-sidebar.tsx",
    "utf8",
  );

  assert.match(sidebarSource, /function SpecsTab\([^)]*\)/);
  assert.match(sidebarSource, /onClick=\{[^}]*handleGenerateSpec/);
  assert.match(sidebarSource, /fetch\("\/api\/ai\/spec"/);
  assert.match(sidebarSource, /useRealtimeRun<typeof generateSpec>/);
});

test("Project specs API exposes metadata and Markdown preview content", () => {
  assert.equal(
    existsSync("src/app/api/projects/[projectId]/specs/route.ts"),
    true,
  );
  assert.equal(
    existsSync("src/app/api/projects/[projectId]/specs/[specId]/route.ts"),
    true,
  );
});

test("Spec generation preflights ProjectSpec storage before starting a run", () => {
  const routeSource = readFileSync("src/app/api/ai/spec/route.ts", "utf8");
  const storageCheckIndex = routeSource.indexOf("prisma.projectSpec.count()");
  const triggerIndex = routeSource.indexOf(
    "tasks.trigger<typeof generateSpec>",
  );

  assert.notEqual(storageCheckIndex, -1);
  assert.notEqual(triggerIndex, -1);
  assert.ok(storageCheckIndex < triggerIndex);
  assert.match(
    routeSource,
    /Spec storage is not ready\. Run `pnpm prisma migrate (?:deploy|dev)` before starting a spec run\./,
  );
});

test("Spec download links opt out of native Base UI button semantics", () => {
  const sidebarSource = readFileSync(
    "src/components/editor/ai-workspace-sidebar.tsx",
    "utf8",
  );
  const nativeButtonOptOuts = sidebarSource.match(/nativeButton=\{false\}/g);

  assert.equal(nativeButtonOptOuts?.length, 2);
});

test("Specs tab constrains generated spec content inside the sidebar", () => {
  const sidebarSource = readFileSync(
    "src/components/editor/ai-workspace-sidebar.tsx",
    "utf8",
  );

  assert.match(
    sidebarSource,
    /<div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 overflow-hidden">/,
  );
  assert.match(
    sidebarSource,
    /<ScrollArea className="h-full min-w-0 max-w-full overflow-hidden pr-2">/,
  );
  assert.match(
    sidebarSource,
    /<p\s+className="whitespace-pre-wrap break-words text-sm leading-6"\s+key=\{key\}\s+>/,
  );
});

test("Generate Spec button uses the shared default button colors", () => {
  const sidebarSource = readFileSync(
    "src/components/editor/ai-workspace-sidebar.tsx",
    "utf8",
  );
  const generateSpecButtonMatch = sidebarSource.match(
    /<Button[\s\S]*?onClick=\{handleGenerateSpec\}[\s\S]*?className="([^"]*)"[\s\S]*?>/,
  );

  assert.ok(generateSpecButtonMatch);
  assert.equal(
    generateSpecButtonMatch[1],
    "w-full disabled:cursor-not-allowed disabled:opacity-60",
  );
});
