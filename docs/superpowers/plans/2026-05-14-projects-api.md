# Projects API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build REST endpoints for listing, creating, renaming, and deleting projects.

**Architecture:** Use Next.js App Router API routes. `GET` and `POST` will be in the collection route, `PATCH` and `DELETE` in the item route. Authentication handled via Clerk.

**Tech Stack:** Next.js, Prisma, Clerk.

---

### Task 1: Project Collection Route (List & Create)

**Files:**
- Create: `src/app/api/projects/route.ts`
- Test: Use `curl` or a REST client.

- [ ] **Step 1: Implement `GET /api/projects`**
  - Use `auth()` from `@clerk/nextjs/server` to get `userId`.
  - If no `userId`, return `401`.
  - Fetch projects from Prisma where `ownerId === userId`.
  - Return JSON list.

- [ ] **Step 2: Implement `POST /api/projects`**
  - Use `auth()` to get `userId`.
  - If no `userId`, return `401`.
  - Parse body for `name`, default to `Untitled Project`.
  - Create project in Prisma with `ownerId === userId`.
  - Return created project with `201`.

- [ ] **Step 3: Verify with tests**
  - Test `GET` (authenticated) -> 200 OK
  - Test `GET` (unauthenticated) -> 401 Unauthorized
  - Test `POST` (authenticated, with name) -> 201 Created
  - Test `POST` (authenticated, no name) -> 201 Created (Untitled Project)
  - Test `POST` (unauthenticated) -> 401 Unauthorized

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/api/projects/route.ts
  git commit -m "feat: implement project list and create api"
  ```

### Task 2: Project Item Route (Rename & Delete)

**Files:**
- Create: `src/app/api/projects/[projectId]/route.ts`
- Test: Use `curl` or a REST client.

- [ ] **Step 1: Implement `PATCH /api/projects/[projectId]`**
  - Use `auth()` to get `userId`.
  - If no `userId`, return `401`.
  - Fetch project by `projectId`.
  - If project not found or `project.ownerId !== userId`, return `403`.
  - Parse body for `name`, update project.
  - Return updated project.

- [ ] **Step 2: Implement `DELETE /api/projects/[projectId]`**
  - Use `auth()` to get `userId`.
  - If no `userId`, return `401`.
  - Fetch project by `projectId`.
  - If project not found or `project.ownerId !== userId`, return `403`.
  - Delete project from Prisma.
  - Return `204 No Content`.

- [ ] **Step 3: Verify with tests**
  - Test `PATCH` (owner) -> 200 OK
  - Test `PATCH` (non-owner) -> 403 Forbidden
  - Test `PATCH` (unauthenticated) -> 401 Unauthorized
  - Test `DELETE` (owner) -> 204 No Content
  - Test `DELETE` (non-owner) -> 403 Forbidden
  - Test `DELETE` (unauthenticated) -> 401 Unauthorized

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/api/projects/[projectId]/route.ts
  git commit -m "feat: implement project rename and delete api"
  ```

### Task 3: Final Verification

- [ ] **Step 1: Run build**
  Run: `pnpm run build`
  Expected: Success.

- [ ] **Step 2: Run lint**
  Run: `pnpm lint`
  Expected: No errors.

- [ ] **Step 3: Commit and update progress tracker**
  Update `context/progress-tracker.md` to mark Projects API as complete.
