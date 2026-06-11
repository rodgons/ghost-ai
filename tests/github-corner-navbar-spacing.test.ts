import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("editor navbar reserves space for the app-wide GitHub corner", () => {
  const navbarSource = readFileSync(
    "src/components/editor/editor-navbar.tsx",
    "utf8",
  );

  assert.match(navbarSource, /pr-20/);
  assert.match(navbarSource, /sm:pr-24/);
});
