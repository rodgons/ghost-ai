# Wire Editor Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the editor home UI to the real Project API and convert the home page to a server component.

**Architecture:** 
- `src/app/editor/page.tsx` becomes a Server Component to fetch projects.
- Create `src/components/editor/editor-home-client.tsx` as a Client Component wrapper to hold UI state (sidebar, dialogs).
- Create `src/hooks/use-project-actions.ts` to replace mock logic with real API calls.
- `useProjectActions` will manage dialog state and project mutations.

**Tech Stack:** Next.js (App Router), Prisma, Clerk, React Hooks.

---

### Task 1: Project Data Helper

**Files:**
- Create: `src/lib/projects.ts`

- [ ] **Step 1: Implement `getProjects` helper**
  - Use `auth()` to get `userId`.
  - Fetch owned projects (`ownerId === userId`).
  - Fetch shared projects (projects where user is a collaborator).
  - Return both lists.

- [ ] **Step 2: Commit**
  ```bash
  git add src/lib/projects.ts
  git commit -m "feat: add project data fetching helper"
  ```

### Task 2: `useProjectActions` Hook

**Files:**
- Create: `src/hooks/use-project-actions.ts`
- Delete: `src/hooks/use-project-dialogs.ts` (once replaced)

- [ ] **Step 1: Implement dialog state management**
  - State for `dialogType` (`create` | `rename` | `delete` | `null`).
  - State for `selectedProjectId` and `projectName`.
  - `openCreateDialog`, `openRenameDialog`, `openDeleteDialog`, `closeDialog`.

- [ ] **Step 2: Implement `createProject` mutation**
  - Generate short unique suffix (e.g., 4-6 alphanumeric chars).
  - Slugify project name.
  - Call `POST /api/projects`.
  - On success, navigate to `/editor/[projectId]`.

- [ ] **Step 3: Implement `renameProject` mutation**
  - Call `PATCH /api/projects/[projectId]`.
  - On success, `router.refresh()`.

- [ ] **Step 4: Implement `deleteProject` mutation**
  - Call `DELETE /api/projects/[projectId]`.
  - On success, if active project, redirect to `/editor`; otherwise `router.refresh()`.

- [ ] **Step 5: Implement `handleSubmit` wrapper**
  - Handle form submission based on `dialogType`.

- [ ] **Step 6: Commit**
  ```bash
  git add src/hooks/use-project-actions.ts
  git commit -m "feat: implement useProjectActions hook with real API calls"
  ```

### Task 3: Editor Home Refactoring (Server -> Client)

**Files:**
- Create: `src/components/editor/editor-home-client.tsx`
- Modify: `src/app/editor/page.tsx`

- [ ] **Step 1: Create `EditorHomeClient` component**
  - Move all client-side logic from `EditorPage` to `EditorHomeClient`.
  - Use `useProjectActions` hook.
  - Wire `ProjectSidebar` and `Dialog` to the hook.
  - Accept `ownedProjects` and `sharedProjects` as props.

- [ ] **Step 2: Convert `EditorPage` to Server Component**
  - Remove `"use client"`.
  - Call `getProjects()` from `src/lib/projects.ts`.
  - Render `EditorHomeClient` and pass the fetched projects.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/editor/editor-home-client.tsx src/app/editor/page.tsx
  git commit -m "refactor: convert editor home to server component and wire client wrapper"
  ```

### Task 4: Final Wiring & Verification

- [ ] **Step 1: Wire `ProjectSidebar` and `Dialog` to `useProjectActions`**
  - Ensure `ProjectSidebar` uses the real projects list.
  - Ensure dialogs pre-fill data (rename current name, delete shows project name).
  - Verify room ID preview in create dialog.

- [ ] **Step 2: End-to-End Verification**
  - Test creating a project -> redirect to editor.
  - Test renaming a project -> sidebar updates.
  - Test deleting a project -> sidebar updates.

- [ ] **Step 3: Final Build & Lint check**
  Run: `pnpm run build && pnpm lint`

- [ ] **Step 4: Commit and update progress tracker**
  Update `context/progress-tracker.md`.
