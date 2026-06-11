import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Bot, FileText, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NODE_COLORS } from "../../types/canvas";

export const dynamic = "force-dynamic";

const workflowSteps = [
  {
    title: "Prompt the architect",
    description:
      "Describe the system, constraints, and services. Ghost AI turns the prompt into canvas changes.",
  },
  {
    title: "Refine the canvas",
    description:
      "Edit nodes, labels, colors, shapes, and edges while collaborators share the same room state.",
  },
  {
    title: "Generate the spec",
    description:
      "Convert the final graph and chat context into a persistent Markdown technical specification.",
  },
] as const;

const features = [
  {
    icon: Sparkles,
    title: "Architecture generation",
    description:
      "Gemini-backed workflows generate validated nodes and edges from natural language.",
  },
  {
    icon: Users,
    title: "Real-time canvas",
    description:
      "Live cursors, presence, node editing, edge editing, undo/redo, and autosave.",
  },
  {
    icon: FileText,
    title: "Spec generation",
    description:
      "Create Markdown specs from the architecture graph and project chat history.",
  },
] as const;

const previewNodes = [
  {
    className: "left-[5%] top-[43%] h-16 w-[18%] rounded-full",
    color: NODE_COLORS[2],
    label: "Client Browser",
  },
  {
    className: "left-[28%] top-[43%] h-16 w-[18%] rounded-full",
    color: NODE_COLORS[3],
    label: "API Gateway",
  },
  {
    className: "left-[56%] top-[24%] h-16 w-[21%] rounded-2xl",
    color: NODE_COLORS[2],
    label: "Auth Service",
  },
  {
    className: "left-[56%] top-[48%] h-16 w-[21%] rounded-2xl",
    color: NODE_COLORS[2],
    label: "Order Service",
  },
  {
    className: "left-[78%] top-[39%] h-20 w-[18%] rounded-[50%/18%]",
    color: NODE_COLORS[2],
    label: "Order DB",
  },
] as const;

const previewEdges = [
  "left-[23%] top-[51%] w-[5%]",
  "left-[46%] top-[51%] w-[10%]",
  "left-[77%] top-[51%] w-[6%]",
] as const;

function LandingButton({ href, label }: { href: string; label: string }) {
  return (
    <Button
      asChild
      nativeButton={false}
      className="bg-primary text-primary-foreground shadow-[0_18px_44px_rgba(124,58,237,0.26)] hover:bg-primary/90"
    >
      <Link href={href}>
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}

export default async function Home() {
  const { userId } = await auth();
  const startHref = userId ? "/editor" : "/sign-up";

  return (
    <main className="min-h-screen overflow-hidden bg-base text-copy-primary">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_20%_0%,var(--primary)_0%,transparent_34%),radial-gradient(circle_at_86%_0%,var(--accent-ai)_0%,transparent_28%)] opacity-25" />

      <header className="border-b border-surface-border bg-surface/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-primary/40 bg-primary/15 text-sm text-accent-text shadow-[0_0_26px_rgba(124,58,237,0.18)]">
              G
            </span>
            <span>Ghost AI</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-copy-muted md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-copy-primary"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="transition-colors hover:text-copy-primary"
            >
              Workflow
            </a>
            <a
              href="#stack"
              className="transition-colors hover:text-copy-primary"
            >
              Stack
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              nativeButton={false}
              variant="outline"
              className="border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <LandingButton href={startHref} label="Start building" />
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3 py-1.5 text-sm font-medium text-accent-text">
            <span className="h-2 w-2 rounded-full bg-primary" />
            AI system design workspace
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.07em] text-copy-primary sm:text-6xl lg:text-7xl">
            Turn system ideas into architecture diagrams and technical specs.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-copy-muted">
            Ghost AI helps developers describe a system, map it onto a
            collaborative canvas, refine the architecture with teammates, and
            generate a Markdown technical specification.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LandingButton href={startHref} label="Start building" />
            <Button
              asChild
              nativeButton={false}
              variant="outline"
              className="border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-sm text-copy-muted">
            <span className="rounded-full border border-surface-border bg-surface px-3 py-1.5">
              Liveblocks collaboration
            </span>
            <span className="rounded-full border border-surface-border bg-surface px-3 py-1.5">
              Trigger.dev workflows
            </span>
            <span className="rounded-full border border-surface-border bg-surface px-3 py-1.5">
              Markdown specs
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-2xl shadow-black/40">
          <div className="flex h-11 items-center justify-between border-b border-surface-border bg-elevated px-4 text-xs text-copy-muted">
            <span>Ghost AI workspace</span>
            <span>Saved · Templates · Share</span>
          </div>
          <div className="grid min-h-[24rem] bg-base md:grid-cols-[9rem_1fr_10rem]">
            <aside className="hidden border-r border-surface-border bg-surface p-4 md:block">
              <p className="text-[10px] tracking-[0.22em] text-faint-text uppercase">
                Workspace
              </p>
              <div className="mt-4 rounded-xl border border-primary/60 bg-primary/20 px-3 py-2 text-sm text-accent-text">
                E-commerce
              </div>
            </aside>

            <div className="relative min-h-[24rem] overflow-hidden bg-[radial-gradient(var(--border-subtle)_1px,transparent_1px)] bg-[size:22px_22px]">
              {previewEdges.map((edge) => (
                <span
                  key={edge}
                  className={`absolute ${edge} h-px bg-copy-primary/55 bg-copy-primary/55 after:absolute after:-top-1 after:-right-1 after:border-y-4 after:border-l-8 after:border-y-transparent after:border-l-copy-primary/55`}
                  aria-hidden="true"
                />
              ))}
              {previewNodes.map((node) => (
                <div
                  key={node.label}
                  className={`absolute grid place-items-center border text-center text-xs font-semibold ${node.className}`}
                  style={{
                    backgroundColor: node.color.fill,
                    borderColor: node.color.text,
                    color: node.color.text,
                  }}
                >
                  {node.label}
                </div>
              ))}
            </div>

            <aside className="hidden border-l border-surface-border bg-surface p-4 md:block">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-accent-text">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
                AI Workspace
              </div>
              <div className="mt-4 rounded-2xl border border-surface-border bg-elevated p-3">
                <p className="text-[10px] tracking-[0.18em] text-faint-text uppercase">
                  AI Architect
                </p>
                <div className="mt-3 rounded-2xl bg-primary px-3 py-2 text-xs leading-5 text-primary-foreground">
                  Design an e-commerce backend
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="bg-zinc-800 pt-5">
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8" id="workflow">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tighter">
              From rough prompt to shared architecture.
            </h2>
            <p className="max-w-md text-sm leading-6 text-copy-muted">
              A focused flow for technical teams that need a design artifact,
              not another blank canvas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-surface-border bg-elevated p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-sm font-bold text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-copy-muted">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8" id="features">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tighter">
              Built around the app&apos;s purple identity.
            </h2>
            <p className="max-w-md text-sm leading-6 text-copy-muted">
              Near-black surfaces, subtle borders, purple CTAs, violet AI
              accents, and canvas nodes matching the current workspace styling.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3" id="stack">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-surface-border bg-elevated p-6"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-copy-muted">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
          <div className="flex flex-col justify-between gap-6 rounded-3xl border border-primary/40 bg-surface p-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">
                Start with a rough idea. Leave with a shared architecture plan.
              </h2>
              <p className="mt-2 text-copy-muted">
                Designed for developers and technical founders who need clarity
                before implementation.
              </p>
            </div>
            <LandingButton href={startHref} label="Start building" />
          </div>
        </section>
      </div>

      <footer className="border-t border-surface-border bg-surface py-6 text-center text-copy-muted">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p>© {new Date().getFullYear()} Ghost AI. All rights reserved.</p>
          <p className="mt-2">
            <a
              href="https://github.com/rodgons"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Contact
            </a>
            <span className="mx-2">•</span>
            <a
              href="https://github.com/rodgons/ghost-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
