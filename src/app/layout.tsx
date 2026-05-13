import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "GHOST-AI",
  description: "Architecture intelligence for authenticated teams",
};

const clerkAppearance = {
  theme: dark,
  variables: {
    colorBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorInputBackground: "var(--input)",
    colorInputText: "var(--foreground)",
    colorInputBorder: "var(--border)",
    colorBorder: "var(--border)",
    colorButtonPrimaryBackground: "var(--primary)",
    colorButtonPrimaryText: "var(--primary-foreground)",
    colorBoxBackground: "var(--card)",
    colorBoxText: "var(--card-foreground)",
    colorTextSecondary: "var(--text-secondary)",
    colorLink: "var(--accent-primary)",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full w-full antialiased dark ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="h-full min-h-screen w-full flex flex-col bg-base text-copy-primary font-geist-sans">
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
