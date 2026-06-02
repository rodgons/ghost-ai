"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      className="border border-navbar-border bg-navbar-control text-navbar-text hover:bg-navbar-control-hover hover:text-navbar-text"
      onClick={toggleTheme}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {isDark ? (
        <Sun className="h-4 w-4" suppressHydrationWarning />
      ) : (
        <Moon className="h-4 w-4" suppressHydrationWarning />
      )}
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </Button>
  );
}
