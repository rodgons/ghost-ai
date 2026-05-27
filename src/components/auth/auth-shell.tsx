import type { ReactNode } from "react";

interface AuthShellProps {
  logo: ReactNode;
  headline: string;
  subtext: string;
  features: {
    icon: ReactNode;
    title: string;
    description: string;
  }[];
  children: ReactNode;
}

export function AuthShell({
  logo,
  headline,
  subtext,
  features,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Left Panel - Marketing Content */}
        <div className="hidden w-1/2 flex-col justify-center gap-12 bg-muted/30 p-12 lg:flex">
          <div className="mx-auto w-full max-w-md">
            {logo}
            <div className="mt-20">
              <h1 className="text-4xl font-semibold text-foreground">
                {headline}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{subtext}</p>
            </div>

            <div className="mt-12 space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/50">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
