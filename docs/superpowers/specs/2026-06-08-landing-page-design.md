# Landing Page Design

## Goal

Build a public Ghost AI landing page for developers and technical founders. The page should explain the app clearly, use the app's dark technical workspace styling, and drive visitors to start building.

## Audience

The primary audience is developers and technical founders who need to move from a rough system idea to a shared architecture plan and technical specification.

## Route Behavior

- Replace the current `/` redirect-only route with a public landing page.
- The route remains a server component.
- Use Clerk `auth()` only to choose the primary CTA target.
- Authenticated users click `Start building` to reach `/editor`.
- Signed-out users click `Start building` to reach `/sign-up`.
- The secondary `Sign in` CTA always links to `/sign-in`.

## Visual Direction

Use a clean, minimal developer-product layout. The page should feel like the existing app, not a separate marketing brand.

The approved demo uses:

- Near-black page background and layered dark surfaces.
- Subtle borders and muted text hierarchy.
- Purple as the dominant product accent for CTA, badges, brand mark, highlights, and cards.
- Existing canvas node palette as secondary visual detail inside the product preview.
- No cyan/green-led identity treatment on the landing page.

## Content Structure

1. Top navigation with Ghost AI brand, section links, `Sign in`, and `Start building`.
2. Hero section with headline: `Turn system ideas into architecture diagrams and technical specs.`
3. Hero subcopy explaining prompt-to-canvas collaboration and Markdown spec generation.
4. Product preview that recreates the app workspace: sidebar, canvas, architecture nodes, and AI workspace panel.
5. Three-step workflow: prompt the architect, refine the canvas, generate the spec.
6. Compact feature strip for architecture generation, real-time canvas, and spec generation.
7. Final CTA: `Start with a rough idea. Leave with a shared architecture plan.`

## Implementation Constraints

- Use `src/app/page.tsx` for the page.
- Keep the page as a server component; do not add client-side state.
- Use existing Tailwind token utilities from `globals.css` where available.
- Do not modify `components/ui/*`.
- Do not add new dependencies.
- Use the existing `Button` component for CTAs.
- Use inline SVG or CSS-only markup for the lightweight product preview; do not depend on external images for this page.
- Update `src/app/layout.tsx` metadata description to match the product positioning.
- Update `context/progress-tracker.md` after the implementation change.

## Testing

Add focused source-level regression coverage that verifies:

- `/` no longer imports or calls `redirect`.
- `/` still imports Clerk `auth()` for CTA selection.
- `/` links signed-out users to `/sign-up` and signed-in users to `/editor`.
- Landing page copy includes the approved headline and workflow/feature sections.
- The page uses purple identity classes and avoids cyan/brand-accent CTA treatment.
- Metadata description matches the landing page product positioning.

## Success Criteria

- Public visitors see the landing page instead of being redirected to sign in.
- Authenticated users can still reach `/editor` from the primary CTA.
- The page visually matches the approved purple demo and existing app palette.
- `pnpm format` and `pnpm lint` pass.
