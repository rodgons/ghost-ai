import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description:
    "Collaborative AI workspace for system architecture diagrams and technical specs.",
};

const themeInitScript = `(() => {
  try {
    const theme = window.localStorage.getItem("ghost-ai-theme");
    const nextTheme = theme === "light" || theme === "dark" ? theme : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", nextTheme === "dark");
    root.classList.toggle("light", nextTheme === "light");
  } catch {
  }
})();`;

function GitHubCorner() {
  return (
    <a
      href="https://github.com/rodgons/ghost-ai"
      target="_blank"
      rel="noreferrer"
      aria-label="View Ghost AI on GitHub"
      title="Check the app code on GitHub"
      className="github-corner fixed top-0 right-0 z-50 text-primary-foreground transition-opacity hover:opacity-90"
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 250 250"
        aria-hidden="true"
        className="h-16 w-16 text-primary-foreground sm:h-20 sm:w-20"
      >
        <path className="fill-primary" d="M0 0l115 115h15l12 27 108 108V0z" />
        <path
          fill="currentColor"
          className="octo-arm"
          d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
        />
        <path
          fill="currentColor"
          className="octo-body"
          d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.4,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.9 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8z"
        />
      </svg>
      <span className="sr-only">View Ghost AI on GitHub</span>
    </a>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Theme class must be set before first paint.
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider
          afterSignOutUrl="/sign-in"
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--background)",
              colorForeground: "var(--foreground)",
              colorInput: "var(--input)",
              colorInputForeground: "var(--foreground)",
              colorPrimary: "var(--primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorNeutral: "var(--foreground)",
              colorMuted: "var(--muted-foreground)",
              colorBorder: "var(--border)",
            },
          }}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
        <GitHubCorner />
      </body>
    </html>
  );
}
