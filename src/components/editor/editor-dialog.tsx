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

export function EditorDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

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
