"use client";

import type * as React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Render a DialogContent element pre-styled for use as an editor dialog shell.
 *
 * @param className - Additional CSS class names to merge with the component's default styling
 * @param props - Remaining props forwarded to `DialogContent`
 * @returns A `DialogContent` element with editor dialog shell styling applied
 */
export function EditorDialogShell({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "w-full max-w-md rounded-3xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a styled header container for an editor dialog.
 *
 * Accepts standard `div` props; the provided `className` is combined with the component's default header classes.
 *
 * @returns A `div` element that serves as the dialog header with editor-specific spacing and padding.
 */
export function EditorDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 px-5 pt-5", className)}
      {...props}
    />
  );
}

/**
 * Renders the editor dialog body container with consistent horizontal and vertical padding.
 *
 * @param className - Additional CSS class names to merge with the default padding classes
 * @returns The rendered `div` element used as the dialog body
 */
export function EditorDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/**
 * Renders a styled footer container for an editor dialog.
 *
 * Applies footer layout (right-aligned controls with spacing), a top border, muted background, and padding; merges any provided `className` and forwards remaining `div` props to the element.
 *
 * @returns The footer DOM element for an editor dialog.
 */
export function EditorDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  DialogDescription as EditorDialogDescription,
  DialogFooter as EditorDialogFooterPrimitive,
  DialogHeader as EditorDialogHeaderPrimitive,
  DialogTitle as EditorDialogTitle,
};
