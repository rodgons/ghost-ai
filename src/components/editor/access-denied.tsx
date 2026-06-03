"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Simple access denied view with a lock icon and a link back to the editor list.
 */
export default function AccessDenied() {
  return (
    <div
      className={cn(
        "flex h-screen flex-col items-center justify-center gap-6",
        "bg-muted/30 p-8",
      )}
    >
      <Lock className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
      <p className="text-muted-foreground">
        You don’t have permission to view this project.
      </p>
      <Link className={buttonVariants({ variant: "default" })} href="/editor">
        Back to Projects
      </Link>
    </div>
  );
}
