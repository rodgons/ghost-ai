# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- In progress

## Current Goal

- Build `/editor` home screen with project dialogs and sidebar actions (sidebar open by default).
- Add Prisma Project and ProjectCollaborator models and client singleton.


## Completed

- Editor navbar refactored to controlled sidebar state with extensible layout regions.
- Floating project sidebar implemented with transitions, tabs, placeholder states, and footer action.
- Shared editor dialog styling foundation added.
- Integrated Clerk authentication into Next.js App Router (proxy middleware and provider).
- Added dedicated sign-in and sign-up routes, protected editor workspace, and Clerk user account controls.
- Project API routes (list, create, rename, delete) implemented with Clerk authentication.

## In Progress

- Build editor home screen with create project dialog.
- Implement rename and delete project dialogs.
- Wire sidebar project actions (rename, delete) to dialogs.
- Add mobile sidebar behavior with backdrop scrim.
- Create project dialogs hook for state management.

## Next Up

- Run lint, formatting, and production build checks.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
