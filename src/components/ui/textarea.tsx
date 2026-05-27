import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Render a styled textarea element that forwards standard textarea props.
 *
 * The component applies a set of default utility classes for sizing, focus,
 * disabled and invalid states, and merges any provided `className` with those
 * defaults.
 *
 * @param className - Additional CSS class names appended to the component's default classes
 * @param props - All other standard `textarea` attributes are forwarded to the underlying element
 * @returns A `<textarea>` element with the component's default styling and any provided attributes
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
