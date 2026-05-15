import { Lock } from "lucide-react";
import Link from "next/link";

export function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center space-y-6 px-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-bg-surface border border-border-default">
          <Lock className="h-8 w-8 text-text-muted" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Access Denied
          </h1>
          <p className="mt-2 text-text-secondary max-w-md">
            You don't have permission to access this project. Please check with
            the project owner or return to the editor home.
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:opacity-90"
        >
          Return to Editor
        </Link>
      </div>
    </div>
  );
}
