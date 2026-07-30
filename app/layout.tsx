import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "TIM — Tourism Investment Monitor",
  description:
    "Should the destination develop, fund, host, acquire, or reject this tourism product, under what conditions, and why? A gate-based, source-cited investment case for events, attractions, accommodation, and MICE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <MotionConfig reducedMotion="user">
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            </MotionConfig>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
