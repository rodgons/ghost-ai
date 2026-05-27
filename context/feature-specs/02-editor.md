Read `AGENTS.md` before starting.

You are a senior frontend architect working inside an existing Next.js + TypeScript + shadcn/ui codebase.

Your task is to implement the foundational editor shell components that will be reused across all future editor chapters. Focus on clean composition, extensibility, accessibility, and production-quality architecture.

## Goals

Build the shared editor chrome:

1. Top editor navbar
2. Floating project sidebar
3. Reusable dialog styling pattern foundation

These components will become the base layout primitives for the entire editor experience.

---

# Technical Context

- Framework: Next.js App Router
- Language: TypeScript
- UI: shadcn/ui
- Icons: lucide-react
- Styling: Tailwind CSS
- Existing design tokens already exist in `globals.css`
- Follow existing project conventions
- Prefer composable and reusable patterns over tightly coupled implementations

---

# 1. Editor Navbar

Create:

`components/editor/editor-navbar.tsx`

## Requirements

Build a fixed-height top navbar intended for all editor screens.

### Layout

The navbar must contain:

- left section
- center section
- right section

Use a layout that keeps all sections aligned and extensible for future controls.

### Left Section

Include a sidebar toggle button.

Behavior:

- when sidebar is open → use `PanelLeftClose`
- when sidebar is closed → use `PanelLeftOpen`

The component should support controlled sidebar state through props rather than internal state.

### Right Section

Keep empty for now, but structure it so future actions can be added without refactoring.

### Styling

Use a dark editor-style appearance:

- dark background
- subtle bottom border
- clean spacing
- production-ready visual hierarchy

---

# 2. Project Sidebar

Create:

`components/editor/project-sidebar.tsx`

## Requirements

Build a floating sidebar panel for project management.

### Behavior

The sidebar must:

- slide in from the left
- overlay above the editor canvas
- NOT shift or push page content
- support open/close transitions
- accept:
  - `isOpen`
  - `onClose`

### Header

Include:

- `Projects` title
- close button

### Tabs

Use shadcn `Tabs` with:

- My Projects
- Shared

Both tabs should currently display an empty placeholder state.

Design the placeholder state cleanly so it can later be replaced with real content.

### Footer Action

At the bottom of the sidebar:

- full-width `New Project` button
- include `Plus` icon

### Architecture Expectations

Structure the component for future extensibility, including:

- project lists
- loading states
- search/filter controls
- async data integration

Avoid tightly coupling UI to mock data.

---

# 3. Dialog Styling Foundation

Create a reusable dialog styling pattern using the existing color tokens from `globals.css`.

## Requirements

Prepare a shared dialog structure that supports:

- title
- description
- footer actions

Do NOT implement actual dialogs yet.

The goal is to establish a reusable styling foundation that future dialogs can adopt consistently.

Favor composability and consistency over premature abstraction.

---

# Quality Expectations

Before finishing, verify:

- components compile with zero TypeScript errors
- no lint issues
- components are accessible
- animations/transitions feel polished
- sidebar interactions behave smoothly
- architecture is ready for future editor expansion

When implementing, prefer maintainable production-quality patterns rather than minimal demos.
