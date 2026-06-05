import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Create Project dialog title uses the foreground text token", () => {
  const dialogSource = readFileSync(
    "src/components/editor/dialogs/create-project-dialog.tsx",
    "utf8",
  );

  assert.match(
    dialogSource,
    /<DialogTitle className="text-foreground">Create Project<\/DialogTitle>/,
  );
});
