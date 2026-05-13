import { Cpu, Share2, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: Cpu,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - large screens only */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-16 lg:py-12 bg-base">
        <div>
          <div className="inline-flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary">
              <span className="text-lg font-bold text-black">G</span>
            </div>
            <span className="text-2xl font-semibold text-copy-primary">
              Ghost AI
            </span>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-copy-primary mb-6 leading-tight">
            Design systems at the speed of thought.
          </h1>
          <p className="text-lg text-copy-secondary mb-12">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <div className="space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <Icon className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-copy-primary mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-copy-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-copy-muted">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </div>

      {/* Right panel - Clerk form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:px-16 bg-base lg:border-l lg:border-white/10">
        <div className="w-full max-w-xl lg:max-w-2xl pl-0 lg:pl-8">
          <div className="flex h-full items-center flex-col rounded-3xl border border-white/10 bg-surface pt-4 pb-12 shadow-[0_20px_80px_rgba(255,255,255,0.03)]">
            <div className="h-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
