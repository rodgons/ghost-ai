import { Button } from "@/components/ui/button";

/**
 * Renders the home page layout with a centered title and test button.
 *
 * @returns The JSX element for the home page: a full-height, centered container with the text `"ghost AI"` and a `Button` labeled `"Test"`.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4 bg-background text-foreground">
      <div>ghost AI</div>
      <Button>Test</Button>
    </div>
  );
}
