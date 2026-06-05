import assert from "node:assert/strict";
import test from "node:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CreateProjectDialog } from "../src/components/editor/dialogs/create-project-dialog.tsx";

test("Create Project dialog title uses the foreground text token", () => {
  render(
    React.createElement(CreateProjectDialog, {
      open: true,
      onOpenChange: () => undefined,
      onCreate: async () => undefined,
    }),
  );

  const title = screen.getByRole("heading", { name: /create project/i });

  assert.ok(title.classList.contains("text-foreground"));
});
