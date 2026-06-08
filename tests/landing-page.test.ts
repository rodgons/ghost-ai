import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("home page renders a public landing page instead of redirecting", () => {
  const pageSource = readFileSync("src/app/page.tsx", "utf8");

  assert.doesNotMatch(pageSource, /from "next\/navigation"/);
  assert.doesNotMatch(pageSource, /redirect\(/);
  assert.match(pageSource, /import \{ auth \} from "@clerk\/nextjs\/server"/);
  assert.match(
    pageSource,
    /Turn system ideas into architecture diagrams and technical specs\./,
  );
});

test("home page chooses CTA targets from authentication state", () => {
  const pageSource = readFileSync("src/app/page.tsx", "utf8");

  assert.match(pageSource, /const \{ userId \} = await auth\(\);/);
  assert.match(
    pageSource,
    /const startHref = userId \? "\/editor" : "\/sign-up";/,
  );
  assert.match(pageSource, /href=\{startHref\}/);
  assert.match(pageSource, /href="\/sign-in"/);
});

test("landing page includes the approved workflow and feature sections", () => {
  const pageSource = readFileSync("src/app/page.tsx", "utf8");

  assert.match(pageSource, /Prompt the architect/);
  assert.match(pageSource, /Refine the canvas/);
  assert.match(pageSource, /Generate the spec/);
  assert.match(pageSource, /Architecture generation/);
  assert.match(pageSource, /Real-time canvas/);
  assert.match(pageSource, /Spec generation/);
});

test("landing page uses purple identity styling", () => {
  const pageSource = readFileSync("src/app/page.tsx", "utf8");

  assert.match(pageSource, /bg-primary/);
  assert.match(pageSource, /text-accent-text/);
  assert.match(pageSource, /border-primary\/40/);
  assert.doesNotMatch(pageSource, /bg-brand\b/);
  assert.doesNotMatch(pageSource, /text-brand\b/);
});

test("metadata describes the public product", () => {
  const layoutSource = readFileSync("src/app/layout.tsx", "utf8");

  assert.match(
    layoutSource,
    /description:\s*"Collaborative AI workspace for system architecture diagrams and technical specs\.",/,
  );
});

test("Clerk proxy allows the public landing page route", () => {
  const proxySource = readFileSync("src/proxy.ts", "utf8");

  assert.match(proxySource, /const publicRoutes = \[/);
  assert.match(proxySource, /"\/",/);
  assert.match(proxySource, /if \(isPublicRoute\(req\)\) \{/);
});
