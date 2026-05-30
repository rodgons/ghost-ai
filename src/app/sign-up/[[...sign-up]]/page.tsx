import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary" />
      <span className="text-lg font-medium">Ghost AI</span>
    </div>
  );
}

function AiIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      role="img"
      aria-label="AI icon"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function CollaborationIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      role="img"
      aria-label="Collaboration icon"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      role="img"
      aria-label="Document icon"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell
      logo={<Logo />}
      headline="Design systems at the speed of thought."
      subtext="Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time."
      features={[
        {
          icon: <AiIcon />,
          title: "AI Architecture Generation",
          description:
            "Describe your system, AI maps it to nodes and edges on a live canvas.",
        },
        {
          icon: <CollaborationIcon />,
          title: "Real-time Collaboration",
          description:
            "Live cursors, presence indicators, and shared node editing across your team.",
        },
        {
          icon: <DocumentIcon />,
          title: "Instant Spec Generation",
          description:
            "Export a complete Markdown technical spec directly from the canvas graph.",
        },
      ]}
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "w-full",
            formButtonPrimary:
              "bg-primary hover:bg-primary/90 text-primary-foreground",
            socialButtonsBlockButton:
              "bg-background hover:bg-muted border-border",
            formFieldInput:
              "bg-background border-border focus:border-primary focus:ring-primary/20",
            footerActionLink: "text-primary hover:underline",
          },
        }}
      />
    </AuthShell>
  );
}
