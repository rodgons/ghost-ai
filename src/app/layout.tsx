import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  description: "Secure AI workspace powered by Clerk",
};

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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
