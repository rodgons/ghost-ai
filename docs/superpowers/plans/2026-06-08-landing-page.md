# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the root redirect with a public, purple-accented Ghost AI landing page that routes signed-out users to sign-up and authenticated users to the editor.

**Architecture:** Keep `src/app/page.tsx` as a React Server Component. Use Clerk `auth()` only to choose CTA destinations, render static marketing sections with existing app token utilities, and avoid client-side state or new routes.

**Tech Stack:** Next.js 16 App Router, React Server Components, Clerk server auth, Tailwind CSS token utilities, existing `Button` component, Node source-level regression tests.

---

## File Structure

- Modify `src/app/page.tsx`: replace redirect-only route with the landing page server component and helper arrays for workflow and feature content.
- Modify `src/app/layout.tsx`: update `metadata.description` from the old Clerk-oriented text to product positioning and render the app-wide GitHub Corner.
- Create `tests/landing-page.test.ts`: source-level regression tests for route behavior, CTA targets, content, footer repository link, and palette direction.
- Modify `context/progress-tracker.md`: record the current goal, implemented landing page, and verification status.

## Tasks

1. Add failing source-level regression coverage for the root route behavior, approved copy, purple styling, and metadata.
2. Replace `src/app/page.tsx` with the public landing page server component.
3. Update `src/app/layout.tsx` metadata to describe the public product.
4. Add the app-wide GitHub Corner to `src/app/layout.tsx`, linking to `https://github.com/rodgons/ghost-ai` with `target="_blank"` and `rel="noreferrer"`.
5. Add the public GitHub repository link to the homepage footer after `Contact`, using `target="_blank"` and `rel="noreferrer"`.
6. Change footer `Contact` to link to `https://github.com/rodgons` and remove the privacy policy link.
7. Update `context/progress-tracker.md` with implementation and verification status.
8. Verify with `node --experimental-strip-types tests/landing-page.test.ts`, `pnpm format`, `pnpm lint`, and `pnpm run build`.

## Self-Review

- Spec coverage: Tasks cover public route behavior, authenticated CTA selection, approved copy, purple visual direction, app-wide GitHub Corner, footer profile/repository links, metadata, progress tracking, and verification.
- Placeholder scan: No placeholders remain.
- Type consistency: `startHref`, `workflowSteps`, `features`, and metadata fields are consistently named across tests and implementation.
